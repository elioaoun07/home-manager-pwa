'use client';

import React, { useState } from 'react';
import { parseEventWithAlerts, formatParsedEvent } from '@/lib/eventParser';
import { addMultipleAlerts, addPresetAlerts, ALERT_PRESETS } from '@/lib/alertManager';
import { supabase } from '@/lib/supabase';

/**
 * Enhanced QuickAdd component that handles:
 * 1. Event date/time parsing
 * 2. Reminder/alert configuration
 * 3. Automatic creation of both event and alerts
 */
export default function QuickAddWithAlerts() {
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (value: string) => {
    setInput(value);
    
    // Show live preview
    if (value.trim()) {
      try {
        const parsed = parseEventWithAlerts(value);
        setPreview(formatParsedEvent(parsed));
      } catch (error) {
        setPreview('');
      }
    } else {
      setPreview('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      setLoading(true);

      // Parse the input
      const parsed = parseEventWithAlerts(input);
      const { smartData, eventStart, eventEnd, allDay, location, alerts } = parsed;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Determine item type (default to event if time detected)
      const itemType = smartData.detections.type?.value || 
        (eventStart ? 'event' : 'task');

      // 1. Create the item
      const { data: item, error: itemError } = await supabase
        .from('items')
        .insert({
          user_id: user.id,
          type: itemType,
          title: smartData.title,
          priority: smartData.detections.priority?.value || 'normal',
          status: 'active',
          responsible_user_id: user.id,
          is_public: smartData.detections.isPublic?.value || false
        })
        .select()
        .single();

      if (itemError) throw itemError;

      // 2. Create event details if it's an event
      if (itemType === 'event' && eventStart) {
        const { error: eventError } = await supabase
          .from('event_details')
          .insert({
            item_id: item.id,
            start_at: eventStart.toISOString(),
            end_at: (eventEnd || new Date(eventStart.getTime() + 60 * 60 * 1000)).toISOString(),
            all_day: allDay || false,
            location_text: location
          });

        if (eventError) throw eventError;

        // 3. Add alerts/reminders
        if (alerts.preset && alerts.preset !== 'custom') {
          await addPresetAlerts(item.id, eventStart, alerts.preset);
        } else if (alerts.custom && alerts.custom.length > 0) {
          await addMultipleAlerts(item.id, eventStart, alerts.custom);
        }
      }

      // 4. Add categories if detected
      if (smartData.detections.categories && smartData.detections.categories.length > 0) {
        for (const cat of smartData.detections.categories) {
          // Find or create category
          const { data: existingCat } = await supabase
            .from('categories')
            .select('id')
            .eq('name', cat.value)
            .eq('user_id', user.id)
            .single();

          let categoryId = existingCat?.id;

          if (!categoryId) {
            const { data: newCat } = await supabase
              .from('categories')
              .insert({
                user_id: user.id,
                name: cat.value,
                color_hex: '#3B82F6'
              })
              .select()
              .single();
            
            categoryId = newCat?.id;
          }

          if (categoryId) {
            await supabase
              .from('item_categories')
              .insert({
                item_id: item.id,
                category_id: categoryId
              });
          }
        }
      }

      // Success!
      alert('✅ Event created with reminders!');
      setInput('');
      setPreview('');
      
      // Trigger refresh (emit event or call callback)
      window.dispatchEvent(new CustomEvent('itemCreated', { detail: item }));

    } catch (error) {
      console.error('Error creating event:', error);
      alert('❌ Failed to create event: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Add Event
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="e.g., Event tomorrow at 6pm invited to parent's house, remind me 1 day and 30 mins before"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-500">
            Try: "Event [when] at [time] [description], remind me [when] before"
          </p>
        </div>

        {preview && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Preview:</h4>
            <pre className="text-sm text-blue-800 whitespace-pre-wrap">
              {preview}
            </pre>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Creating...' : 'Add Event with Reminders'}
        </button>
      </form>

      {/* Examples */}
      <div className="mt-8 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Examples:</h3>
        <div className="space-y-2">
          {[
            "Event tomorrow at 6pm parent's house, remind me 1 day and 30 mins before",
            "Important meeting next Monday at 2pm for 2 hours",
            "Doctor appointment Friday at 10am, remind me 1 week before",
            "Birthday party Saturday at 8pm all day",
            "Dentist next Tuesday at 9:30am, minimal reminders"
          ].map((example, i) => (
            <button
              key={i}
              onClick={() => handleInputChange(example)}
              className="block w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-sm text-gray-700 transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Clock, Calendar } from 'lucide-react';

export interface AlarmConfig {
  id: string;
  type: 'relative' | 'absolute';
  // For relative alarms
  offset_minutes?: number;
  // For absolute alarms
  absolute_time?: string; // ISO string
  channel: 'push' | 'email' | 'sms';
}

interface AlarmPickerProps {
  eventStartTime: Date | null;
  existingAlarms?: AlarmConfig[];
  onChange: (alarms: AlarmConfig[]) => void;
}

const RELATIVE_PRESETS = [
  { label: 'At time of event', minutes: 0 },
  { label: '5 minutes before', minutes: 5 },
  { label: '15 minutes before', minutes: 15 },
  { label: '30 minutes before', minutes: 30 },
  { label: '1 hour before', minutes: 60 },
  { label: '2 hours before', minutes: 120 },
  { label: '1 day before', minutes: 1440 },
  { label: '2 days before', minutes: 2880 },
  { label: '1 week before', minutes: 10080 },
];

const QUICK_PRESETS = [
  { name: 'Standard', alarms: [30, 1440] },
  { name: 'Important', alarms: [15, 60, 1440, 10080] },
  { name: 'Minimal', alarms: [15] },
  { name: 'Daily', alarms: [1440] },
];

export function AlarmPicker({ eventStartTime, existingAlarms = [], onChange }: AlarmPickerProps) {
  const [alarms, setAlarms] = useState<AlarmConfig[]>(existingAlarms);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addType, setAddType] = useState<'relative' | 'absolute'>('relative');

  useEffect(() => {
    onChange(alarms);
  }, [alarms, onChange]);

  const addRelativeAlarm = (minutes: number) => {
    const newAlarm: AlarmConfig = {
      id: `alarm-${Date.now()}-${Math.random()}`,
      type: 'relative',
      offset_minutes: minutes,
      channel: 'push'
    };
    setAlarms([...alarms, newAlarm]);
    setShowAddMenu(false);
  };

  const addAbsoluteAlarm = (datetime: string) => {
    const newAlarm: AlarmConfig = {
      id: `alarm-${Date.now()}-${Math.random()}`,
      type: 'absolute',
      absolute_time: datetime,
      channel: 'push'
    };
    setAlarms([...alarms, newAlarm]);
    setShowAddMenu(false);
  };

  const applyPreset = (minutes: number[]) => {
    const newAlarms = minutes.map(min => ({
      id: `alarm-${Date.now()}-${Math.random()}-${min}`,
      type: 'relative' as const,
      offset_minutes: min,
      channel: 'push' as const
    }));
    setAlarms(newAlarms);
    setShowAddMenu(false);
  };

  const removeAlarm = (id: string) => {
    setAlarms(alarms.filter(a => a.id !== id));
  };

  const updateAlarmChannel = (id: string, channel: 'push' | 'email' | 'sms') => {
    setAlarms(alarms.map(a => a.id === id ? { ...a, channel } : a));
  };

  const formatAlarm = (alarm: AlarmConfig): string => {
    if (alarm.type === 'relative') {
      const minutes = alarm.offset_minutes || 0;
      if (minutes === 0) return 'At time of event';
      if (minutes < 60) return `${minutes} min${minutes !== 1 ? 's' : ''} before`;
      if (minutes < 1440) {
        const hours = Math.floor(minutes / 60);
        return `${hours} hour${hours !== 1 ? 's' : ''} before`;
      }
      if (minutes < 10080) {
        const days = Math.floor(minutes / 1440);
        return `${days} day${days !== 1 ? 's' : ''} before`;
      }
      const weeks = Math.floor(minutes / 10080);
      return `${weeks} week${weeks !== 1 ? 's' : ''} before`;
    } else {
      // Absolute alarm
      const date = new Date(alarm.absolute_time!);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
  };

  const getAlarmTriggerTime = (alarm: AlarmConfig): string => {
    if (!eventStartTime) return 'Set event time first';
    
    if (alarm.type === 'relative') {
      const triggerTime = new Date(eventStartTime.getTime() - (alarm.offset_minutes || 0) * 60000);
      return triggerTime.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } else {
      return new Date(alarm.absolute_time!).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Bell className="w-4 h-4" />
          Alarms
        </label>
        <button
          type="button"
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          + Add Alarm
        </button>
      </div>

      {/* Add Alarm Menu */}
      {showAddMenu && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4 border border-gray-200">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAddType('relative')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                addType === 'relative'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Relative
            </button>
            <button
              type="button"
              onClick={() => setAddType('absolute')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                addType === 'absolute'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Exact Time
            </button>
          </div>

          {addType === 'relative' ? (
            <>
              {/* Quick Presets */}
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Quick Presets:</p>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_PRESETS.map(preset => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => applyPreset(preset.alarms)}
                      className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Individual Options */}
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Or choose individual:</p>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {RELATIVE_PRESETS.map(preset => (
                    <button
                      key={preset.minutes}
                      type="button"
                      onClick={() => addRelativeAlarm(preset.minutes)}
                      className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Select exact date & time:</p>
              <div className="flex gap-2">
                <input
                  type="datetime-local"
                  onChange={(e) => {
                    if (e.target.value) {
                      addAbsoluteAlarm(new Date(e.target.value).toISOString());
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Current Alarms */}
      {alarms.length > 0 ? (
        <div className="space-y-2">
          {alarms
            .sort((a, b) => {
              if (a.type === 'relative' && b.type === 'relative') {
                return (a.offset_minutes || 0) - (b.offset_minutes || 0);
              }
              if (a.type === 'absolute' && b.type === 'absolute') {
                return new Date(a.absolute_time!).getTime() - new Date(b.absolute_time!).getTime();
              }
              return a.type === 'relative' ? -1 : 1;
            })
            .map((alarm) => (
              <div
                key={alarm.id}
                className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <Bell className="w-4 h-4 text-blue-600 flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {formatAlarm(alarm)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getAlarmTriggerTime(alarm)}
                  </p>
                </div>

                <select
                  value={alarm.channel}
                  onChange={(e) => updateAlarmChannel(alarm.id, e.target.value as any)}
                  className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="push">Push</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                </select>

                <button
                  type="button"
                  onClick={() => removeAlarm(alarm.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Remove alarm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">No alarms set</p>
      )}
    </div>
  );
}

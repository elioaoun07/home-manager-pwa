'use client';

import React, { useState, useEffect } from 'react';
import {
  addMultipleAlerts,
  getItemAlerts,
  deleteAlert,
  toggleAlert,
  formatOffset,
  ALERT_PRESETS,
  OFFSET_OPTIONS,
  type Alert,
  type AlertPreset,
  type AlertChannel
} from '@/lib/alertManager';

interface AlertManagerProps {
  itemId: string;
  eventStart: Date;
  onAlertsChange?: () => void;
}

export default function AlertManager({ itemId, eventStart, onAlertsChange }: AlertManagerProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<string>('standard');
  const [customMode, setCustomMode] = useState(false);
  const [customAlerts, setCustomAlerts] = useState<AlertPreset[]>([
    { offset_minutes: 30, channel: 'push' }
  ]);

  useEffect(() => {
    loadAlerts();
  }, [itemId]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await getItemAlerts(itemId);
      setAlerts(data);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = async () => {
    try {
      const presetAlerts = ALERT_PRESETS[selectedPreset];
      await addMultipleAlerts(itemId, eventStart, presetAlerts);
      await loadAlerts();
      onAlertsChange?.();
    } catch (error) {
      console.error('Error applying preset:', error);
      alert('Failed to apply preset');
    }
  };

  const handleApplyCustom = async () => {
    try {
      await addMultipleAlerts(itemId, eventStart, customAlerts);
      await loadAlerts();
      onAlertsChange?.();
      setCustomMode(false);
    } catch (error) {
      console.error('Error applying custom alerts:', error);
      alert('Failed to apply custom alerts');
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      await deleteAlert(alertId);
      await loadAlerts();
      onAlertsChange?.();
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const handleToggleAlert = async (alertId: string, active: boolean) => {
    try {
      await toggleAlert(alertId, !active);
      await loadAlerts();
      onAlertsChange?.();
    } catch (error) {
      console.error('Error toggling alert:', error);
    }
  };

  const addCustomAlert = () => {
    setCustomAlerts([...customAlerts, { offset_minutes: 60, channel: 'push' }]);
  };

  const updateCustomAlert = (index: number, field: keyof AlertPreset, value: any) => {
    const updated = [...customAlerts];
    updated[index] = { ...updated[index], [field]: value };
    setCustomAlerts(updated);
  };

  const removeCustomAlert = (index: number) => {
    setCustomAlerts(customAlerts.filter((_, i) => i !== index));
  };

  if (loading) {
    return <div className="p-4 text-center">Loading alerts...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Reminders</h3>
        <button
          onClick={() => setCustomMode(!customMode)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {customMode ? 'Use Preset' : 'Custom'}
        </button>
      </div>

      {!customMode ? (
        /* PRESET MODE */
        <div className="space-y-3">
          <div className="flex gap-2">
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="standard">Standard (30 mins, 1 day)</option>
              <option value="important">Important (1 week, 1 day, 1 hour, 15 mins)</option>
              <option value="minimal">Minimal (15 mins only)</option>
              <option value="daily">Daily (1 day before)</option>
              <option value="weekly">Weekly (1 week before)</option>
            </select>
            <button
              onClick={handleApplyPreset}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
          </div>

          {/* Preview preset */}
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">Will add:</p>
            <ul className="list-disc list-inside space-y-1">
              {ALERT_PRESETS[selectedPreset]?.map((alert, i) => (
                <li key={i}>
                  {formatOffset(alert.offset_minutes)} ({alert.channel})
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        /* CUSTOM MODE */
        <div className="space-y-3">
          {customAlerts.map((alert, index) => (
            <div key={index} className="flex gap-2 items-center">
              <select
                value={alert.offset_minutes}
                onChange={(e) => updateCustomAlert(index, 'offset_minutes', parseInt(e.target.value))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {OFFSET_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              
              <select
                value={alert.channel}
                onChange={(e) => updateCustomAlert(index, 'channel', e.target.value as AlertChannel)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="push">Push</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="in_app">In-App</option>
              </select>

              <button
                onClick={() => removeCustomAlert(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove alert"
              >
                ✕
              </button>
            </div>
          ))}

          <div className="flex gap-2">
            <button
              onClick={addCustomAlert}
              className="flex-1 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-gray-400 hover:text-gray-700 transition-colors"
            >
              + Add Alert
            </button>
            <button
              onClick={handleApplyCustom}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* CURRENT ALERTS */}
      {alerts.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Active Reminders</h4>
          <div className="space-y-2">
            {alerts
              .sort((a, b) => (a.offset_minutes || 0) - (b.offset_minutes || 0))
              .map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    alert.active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={alert.active}
                      onChange={() => handleToggleAlert(alert.id, alert.active)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-sm font-medium">
                        {formatOffset(alert.offset_minutes || 0)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {alert.channel} • {new Date(alert.trigger_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteAlert(alert.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete alert"
                  >
                    🗑️
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

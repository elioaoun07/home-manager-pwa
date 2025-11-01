'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Trash2, Clock, Calendar, Plus, Smartphone, Mail, MessageSquare } from 'lucide-react';

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
  { label: 'At time', minutes: 0 },
  { label: '5 min', minutes: 5 },
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '2 hours', minutes: 120 },
  { label: '1 day', minutes: 1440 },
  { label: '2 days', minutes: 2880 },
  { label: '1 week', minutes: 10080 },
];

const QUICK_PRESETS = [
  { 
    name: 'Minimal', 
    alarms: [15], 
    gradient: 'linear-gradient(to bottom right, rgb(107, 114, 128), rgb(75, 85, 99))',
    shadow: '0 0 20px rgba(107,114,128,0.5)'
  },
  { 
    name: 'Standard', 
    alarms: [30, 1440], 
    gradient: 'linear-gradient(to bottom right, rgb(59, 130, 246), rgb(6, 182, 212))',
    shadow: '0 0 20px rgba(59,130,246,0.5)'
  },
  { 
    name: 'Important', 
    alarms: [15, 60, 1440], 
    gradient: 'linear-gradient(to bottom right, rgb(249, 115, 22), rgb(245, 158, 11))',
    shadow: '0 0 20px rgba(249,115,22,0.5)'
  },
];

export function AlarmPicker({ eventStartTime, existingAlarms = [], onChange }: AlarmPickerProps) {
  const [alarms, setAlarms] = useState<AlarmConfig[]>(existingAlarms);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addType, setAddType] = useState<'relative' | 'absolute'>('relative');
  const [hoveredPreset, setHoveredPreset] = useState<string | null>(null);

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
      if (minutes === 0) return 'At time';
      if (minutes < 60) return `${minutes}m before`;
      if (minutes < 1440) {
        const hours = Math.floor(minutes / 60);
        return `${hours}h before`;
      }
      if (minutes < 10080) {
        const days = Math.floor(minutes / 1440);
        return `${days}d before`;
      }
      const weeks = Math.floor(minutes / 10080);
      return `${weeks}w before`;
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
      {/* Current Alarms */}
      {alarms.length > 0 && (
        <div className="flex flex-wrap gap-2">
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
            .map((alarm) => {
              const ChannelIcon = alarm.channel === 'push' ? Smartphone : alarm.channel === 'email' ? Mail : MessageSquare;
              
              return (
              <div
                key={alarm.id}
                className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm rounded-lg border border-blue-200/50 dark:border-blue-700/30 hover:border-blue-300 dark:hover:border-blue-600 transition-all"
              >
                <Bell className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatAlarm(alarm)}
                </span>

                <div className="flex items-center gap-1 px-2 py-1 bg-white/60 dark:bg-gray-800/60 rounded-md border border-gray-300/50 dark:border-gray-600/50">
                  <ChannelIcon className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                  <select
                    value={alarm.channel}
                    onChange={(e) => updateAlarmChannel(alarm.id, e.target.value as 'push' | 'email' | 'sms')}
                    className="text-xs bg-transparent border-none focus:ring-0 focus:outline-none text-gray-700 dark:text-gray-300 cursor-pointer pr-1"
                  >
                    <option value="push">Push</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => removeAlarm(alarm.id)}
                  className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove alarm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              );
            })}
        </div>
      )}

      {/* Add Alarm Button */}
      <button
        type="button"
        onClick={() => setShowAddMenu(!showAddMenu)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        <Plus className="w-4 h-4" />
        Add Alarm
      </button>

      {/* Add Alarm Menu */}
      {showAddMenu && (
        <div className="bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-900/80 dark:to-gray-800/80 backdrop-blur-sm rounded-xl p-4 space-y-4 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          {/* Quick Presets */}
          <div>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Quick Presets</p>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_PRESETS.map(preset => {
                const isHovered = hoveredPreset === preset.name;
                return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset.alarms)}
                  onMouseEnter={() => setHoveredPreset(preset.name)}
                  onMouseLeave={() => setHoveredPreset(null)}
                  className="px-3 py-2.5 backdrop-blur-sm border rounded-lg text-xs font-bold transition-all dark:bg-gray-800/80 dark:border-gray-700 dark:text-gray-300"
                  style={isHovered ? {
                    background: preset.gradient,
                    color: 'white',
                    borderColor: 'transparent',
                    boxShadow: preset.shadow,
                  } : {}}
                >
                  {preset.name}
                </button>
                );
              })}
            </div>
          </div>

          {/* Type Toggle */}
          <div className="flex gap-2 p-1 bg-gray-100/80 dark:bg-gray-800/80 rounded-lg">
            <button
              type="button"
              onClick={() => setAddType('relative')}
              className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                addType === 'relative'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5 inline mr-1.5" />
              Relative
            </button>
            <button
              type="button"
              onClick={() => setAddType('absolute')}
              className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                addType === 'absolute'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 inline mr-1.5" />
              Exact Time
            </button>
          </div>

          {addType === 'relative' ? (
            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
              {RELATIVE_PRESETS.map(preset => (
                <button
                  key={preset.minutes}
                  type="button"
                  onClick={() => addRelativeAlarm(preset.minutes)}
                  className="px-3 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-700 dark:text-gray-300 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 dark:hover:from-emerald-900/40 dark:hover:to-teal-900/40 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all font-medium"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <input
                type="datetime-local"
                onChange={(e) => {
                  if (e.target.value) {
                    addAbsoluteAlarm(new Date(e.target.value).toISOString());
                  }
                }}
                className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 dark:focus:border-blue-600 transition-all"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// src/components/ProgressGraphs.js - Progress graphs and charts for parent dashboard

import React from 'react';
import { motion } from 'framer-motion';

/**
 * Simple Line Chart Component
 */
const LineChart = ({ data, height = 200, color = '#667eea', fillColor = 'rgba(102, 126, 234, 0.1)' }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666',
        background: 'rgba(0, 0, 0, 0.02)',
        borderRadius: '12px',
        border: '1px solid rgba(0, 0, 0, 0.1)'
      }}>
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1;

  const width = 400;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Generate points for the line
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * chartWidth;
    const y = chartHeight - ((item.value - minValue) / range) * chartHeight;
    return `${x + padding},${y + padding}`;
  }).join(' ');

  // Generate area path
  const areaPoints = [
    `${padding},${height - padding}`,
    ...data.map((item, index) => {
      const x = (index / (data.length - 1)) * chartWidth;
      const y = chartHeight - ((item.value - minValue) / range) * chartHeight;
      return `${x + padding},${y + padding}`;
    }),
    `${width - padding},${height - padding}`
  ].join(' ');

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg width={width} height={height} style={{ minWidth: width }}>
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />

        {/* Area fill */}
        <motion.polygon
          points={areaPoints}
          fill={fillColor}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        />

        {/* Line */}
        <motion.polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />

        {/* Data points */}
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * chartWidth + padding;
          const y = chartHeight - ((item.value - minValue) / range) * chartHeight + padding;

          return (
            <motion.g key={index}>
              <motion.circle
                cx={x}
                cy={y}
                r="4"
                fill={color}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              />
              <motion.circle
                cx={x}
                cy={y}
                r="8"
                fill="rgba(255,255,255,0.8)"
                stroke={color}
                strokeWidth="2"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
              />
              {/* Tooltip on hover */}
              <title>{`${item.label}: ${item.value}${item.unit || ''}`}</title>
            </motion.g>
          );
        })}

        {/* Y-axis labels */}
        <text x="5" y={padding} fill="#666" fontSize="12" textAnchor="start">
          {maxValue}{data[0]?.unit || ''}
        </text>
        <text x="5" y={height - padding + 5} fill="#666" fontSize="12" textAnchor="start">
          {minValue}{data[0]?.unit || ''}
        </text>
      </svg>
    </div>
  );
};

/**
 * Bar Chart Component
 */
const BarChart = ({ data, height = 200, color = '#10b981' }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666',
        background: 'rgba(0, 0, 0, 0.02)',
        borderRadius: '12px',
        border: '1px solid rgba(0, 0, 0, 0.1)'
      }}>
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const width = 400;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const barWidth = chartWidth / data.length * 0.8;
  const barSpacing = chartWidth / data.length * 0.2;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg width={width} height={height} style={{ minWidth: width }}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * chartHeight;
          const x = index * (barWidth + barSpacing) + padding + barSpacing / 2;
          const y = height - padding - barHeight;

          return (
            <motion.g key={index}>
              {/* Bar */}
              <motion.rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                rx="4"
                initial={{ height: 0, y: height - padding }}
                animate={{ height: barHeight, y }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              />

              {/* Value label */}
              <motion.text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize="12"
                fill="#333"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
              >
                {item.value}
              </motion.text>

              {/* X-axis label */}
              <motion.text
                x={x + barWidth / 2}
                y={height - 5}
                textAnchor="middle"
                fontSize="10"
                fill="#666"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 1 + index * 0.1 }}
              >
                {item.label}
              </motion.text>

              {/* Tooltip */}
              <title>{`${item.label}: ${item.value}${item.unit || ''}`}</title>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
};

/**
 * Donut Chart Component
 */
const DonutChart = ({ data, size = 200, innerRadius = 60 }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666',
        background: 'rgba(0, 0, 0, 0.02)',
        borderRadius: '50%',
        border: '1px solid rgba(0, 0, 0, 0.1)'
      }}>
        No data
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const center = size / 2;
  const radius = (size - 40) / 2;

  let currentAngle = -Math.PI / 2; // Start at top

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size}>
        {data.map((item, index) => {
          const percentage = item.value / total;
          const angle = percentage * 2 * Math.PI;
          const endAngle = currentAngle + angle;

          const x1 = center + radius * Math.cos(currentAngle);
          const y1 = center + radius * Math.sin(currentAngle);
          const x2 = center + radius * Math.cos(endAngle);
          const y2 = center + radius * Math.sin(endAngle);

          const innerX1 = center + innerRadius * Math.cos(currentAngle);
          const innerY1 = center + innerRadius * Math.sin(currentAngle);
          const innerX2 = center + innerRadius * Math.cos(endAngle);
          const innerY2 = center + innerRadius * Math.sin(endAngle);

          const largeArcFlag = angle > Math.PI ? 1 : 0;

          const pathData = [
            `M ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            `L ${innerX2} ${innerY2}`,
            `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerX1} ${innerY1}`,
            'Z'
          ].join(' ');

          const result = (
            <motion.path
              key={index}
              d={pathData}
              fill={item.color}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <title>{`${item.label}: ${item.value}${item.unit || ''} (${Math.round(percentage * 100)}%)`}</title>
            </motion.path>
          );

          currentAngle = endAngle;
          return result;
        })}
      </svg>

      {/* Center text */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#333' }}>
          {total}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#666' }}>
          Total
        </div>
      </div>
    </div>
  );
};

/**
 * Time Spent Progress Graph
 */
export const TimeSpentGraph = ({ dailyActivity, formatTime }) => {
  const data = dailyActivity?.slice(-14).map(day => ({
    label: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: day.timeSpent,
    unit: 'm'
  })) || [];

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '16px',
      padding: '1.5rem',
      border: '1px solid rgba(0, 0, 0, 0.1)'
    }}>
      <h4 style={{ margin: '0 0 1rem 0', color: '#333', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        📈 Learning Time (Last 14 Days)
      </h4>
      <LineChart
        data={data}
        height={200}
        color="#667eea"
        fillColor="rgba(102, 126, 234, 0.1)"
      />
    </div>
  );
};

/**
 * Tasks Completed Progress Graph
 */
export const TasksCompletedGraph = ({ dailyActivity }) => {
  const data = dailyActivity?.slice(-7).map(day => ({
    label: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
    value: day.sessions,
    unit: ''
  })) || [];

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '16px',
      padding: '1.5rem',
      border: '1px solid rgba(0, 0, 0, 0.1)'
    }}>
      <h4 style={{ margin: '0 0 1rem 0', color: '#333', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        📊 Sessions Completed (Last 7 Days)
      </h4>
      <BarChart
        data={data}
        height={200}
        color="#10b981"
      />
    </div>
  );
};

/**
 * Learning Distribution Donut Chart
 */
export const LearningDistributionChart = ({ stats }) => {
  if (!stats) return null;

  const data = [
    {
      label: 'Time Spent',
      value: stats.totalTimeSpent || 0,
      color: '#667eea',
      unit: 'm'
    },
    {
      label: 'Remaining Goal',
      value: Math.max(0, 420 - (stats.totalTimeSpent || 0)), // Weekly goal of 7 hours
      color: '#e5e7eb',
      unit: 'm'
    }
  ].filter(item => item.value > 0);

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '16px',
      padding: '1.5rem',
      border: '1px solid rgba(0, 0, 0, 0.1)',
      textAlign: 'center'
    }}>
      <h4 style={{ margin: '0 0 1rem 0', color: '#333' }}>
        🎯 Weekly Goal Progress
      </h4>
      <DonutChart data={data} size={160} innerRadius={50} />
      <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
        {stats.totalTimeSpent || 0} / 420 minutes
      </div>
    </div>
  );
};

export default {
  TimeSpentGraph,
  TasksCompletedGraph,
  LearningDistributionChart,
  LineChart,
  BarChart,
  DonutChart
};
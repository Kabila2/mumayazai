import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import './AnalyticsCharts.css';

const AnalyticsCharts = ({ data, language = 'en' }) => {
  const lineChartRef = useRef(null);
  const barChartRef = useRef(null);
  const radarChartRef = useRef(null);

  const translations = {
    en: {
      progressTrend: 'Progress Trend',
      topicPerformance: 'Topic Performance',
      skillsRadar: 'Skills Radar',
      week: 'Week',
      score: 'Score',
      noData: 'No data available'
    },
    ar: {
      progressTrend: 'اتجاه التقدم',
      topicPerformance: 'أداء المواضيع',
      skillsRadar: 'مهارات الرادار',
      week: 'أسبوع',
      score: 'النتيجة',
      noData: 'لا توجد بيانات متاحة'
    }
  };

  const t = translations[language] || translations.en;

  // Draw Line Chart
  useEffect(() => {
    if (!lineChartRef.current || !data?.progressTrend?.length) return;

    const canvas = lineChartRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const points = data.progressTrend;
    const maxScore = 100;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Draw axes
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw grid lines
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();

      // Y-axis labels
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`${100 - i * 25}%`, padding - 10, y + 4);
    }

    // Draw line
    if (points.length > 1) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.beginPath();

      points.forEach((point, index) => {
        const x = padding + (chartWidth / (points.length - 1)) * index;
        const y = height - padding - (point.score / maxScore) * chartHeight;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw points
      points.forEach((point, index) => {
        const x = padding + (chartWidth / (points.length - 1)) * index;
        const y = height - padding - (point.score / maxScore) * chartHeight;

        // Point circle
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();

        // X-axis labels
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(point.label, x, height - padding + 20);
      });
    }
  }, [data]);

  // Draw Bar Chart
  useEffect(() => {
    if (!barChartRef.current || !data?.topicScores?.length) return;

    const canvas = barChartRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const topics = data.topicScores;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const barWidth = chartWidth / topics.length - 10;

    // Draw axes
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw bars
    topics.forEach((topic, index) => {
      const x = padding + (chartWidth / topics.length) * index + 5;
      const barHeight = (topic.score / 100) * chartHeight;
      const y = height - padding - barHeight;

      // Gradient
      const gradient = ctx.createLinearGradient(0, y, 0, height - padding);
      gradient.addColorStop(0, topic.color || '#10b981');
      gradient.addColorStop(1, topic.color ? topic.color + '80' : '#10b98180');

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Score text
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${topic.score}%`, x + barWidth / 2, y - 5);

      // Topic label
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px Arial';
      ctx.save();
      ctx.translate(x + barWidth / 2, height - padding + 15);
      ctx.rotate(-Math.PI / 6);
      ctx.textAlign = 'right';
      ctx.fillText(topic.name, 0, 0);
      ctx.restore();
    });
  }, [data]);

  // Draw Radar Chart
  useEffect(() => {
    if (!radarChartRef.current || !data?.skills?.length) return;

    const canvas = radarChartRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const skills = data.skills;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 50;
    const angleStep = (Math.PI * 2) / skills.length;

    // Draw concentric circles
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius / 5) * i, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#e5e7eb';
    skills.forEach((skill, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Labels
      const labelX = centerX + Math.cos(angle) * (radius + 30);
      const labelY = centerY + Math.sin(angle) * (radius + 30);
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(skill.name, labelX, labelY);
    });

    // Draw data polygon
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();

    skills.forEach((skill, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const distance = (skill.score / 100) * radius;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw points
    skills.forEach((skill, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const distance = (skill.score / 100) * radius;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [data]);

  return (
    <div className="analytics-charts">
      {/* Line Chart - Progress Trend */}
      <motion.div
        className="chart-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="chart-title">📈 {t.progressTrend}</h3>
        <canvas ref={lineChartRef} width="600" height="300" className="chart-canvas" />
      </motion.div>

      {/* Bar Chart - Topic Performance */}
      <motion.div
        className="chart-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="chart-title">📊 {t.topicPerformance}</h3>
        <canvas ref={barChartRef} width="600" height="300" className="chart-canvas" />
      </motion.div>

      {/* Radar Chart - Skills */}
      <motion.div
        className="chart-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="chart-title">🎯 {t.skillsRadar}</h3>
        <canvas ref={radarChartRef} width="400" height="400" className="chart-canvas radar" />
      </motion.div>
    </div>
  );
};

export default AnalyticsCharts;

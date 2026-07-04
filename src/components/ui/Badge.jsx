import { APPOINTMENT_STATUSES } from '../../utils/constants';

const Badge = ({ status }) => {
  const config = APPOINTMENT_STATUSES[status] || {
    label: status,
    color: '#6b7280',
    bg: '#f3f4f6',
  };

  return (
    <span
      className="badge"
      style={{ color: config.color, backgroundColor: config.bg, borderColor: config.color + '33' }}
    >
      {config.label}
    </span>
  );
};

export default Badge;

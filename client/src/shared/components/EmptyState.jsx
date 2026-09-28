import Icon from './Icon';

const EmptyState = ({ icon = 'inbox', title, body, action }) => {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border-strong px-6 py-10 text-center">
      <Icon name={icon} className="text-text-muted" style={{ fontSize: '2rem' }} />
      <h3 className="text-card-title text-text-primary">{title}</h3>
      {body && <p className="text-body-sm text-text-secondary">{body}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
};

export default EmptyState;

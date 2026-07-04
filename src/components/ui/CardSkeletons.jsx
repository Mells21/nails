import Skeleton from './Skeleton';

export const ServiceOptionSkeleton = () => (
  <div className="service-option skeleton-wrap">
    <Skeleton className="service-option-media" />
    <div className="service-option-body">
      <Skeleton className="skeleton-text" style={{ width: '65%', marginBottom: 8 }} />
      <Skeleton className="skeleton-text" style={{ width: '100%', marginBottom: 4 }} />
      <Skeleton className="skeleton-text" style={{ width: '85%', marginBottom: 12 }} />
      <div className="service-option-meta">
        <Skeleton className="skeleton-text" style={{ width: 50 }} />
        <Skeleton className="skeleton-text" style={{ width: 60, height: 15 }} />
      </div>
    </div>
  </div>
);

export const ServiceAdminCardSkeleton = () => (
  <div className="service-admin-card skeleton-wrap">
    <Skeleton className="service-admin-media" />
    <div className="service-admin-body">
      <Skeleton className="skeleton-text" style={{ width: '55%', marginBottom: 4 }} />
      <Skeleton className="skeleton-text" style={{ width: '90%' }} />
      <div className="service-admin-meta">
        <Skeleton className="skeleton-text" style={{ width: 50 }} />
        <Skeleton className="skeleton-text" style={{ width: 60 }} />
      </div>
      <div className="service-admin-actions">
        <Skeleton style={{ width: 70, height: 28, borderRadius: 8 }} />
        <Skeleton style={{ width: 90, height: 28, borderRadius: 8 }} />
      </div>
    </div>
  </div>
);

export const AppointmentCardSkeleton = () => (
  <div className="appointment-card skeleton-wrap">
    <div className="apt-header">
      <Skeleton style={{ width: 90, height: 22, borderRadius: 999 }} />
      <Skeleton className="skeleton-text" style={{ width: 110 }} />
    </div>
    <div className="apt-body">
      <Skeleton className="skeleton-text" style={{ width: 120, height: 14 }} />
      <Skeleton className="skeleton-text" style={{ width: 90 }} />
      <Skeleton className="skeleton-text" style={{ width: 70 }} />
    </div>
  </div>
);

export const StatCardSkeleton = () => (
  <div className="stat-card skeleton-wrap">
    <Skeleton style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0 }} />
    <div className="stat-info">
      <Skeleton className="skeleton-text" style={{ width: 50, height: 22, marginBottom: 6 }} />
      <Skeleton className="skeleton-text" style={{ width: 80 }} />
    </div>
  </div>
);

export const ClientCardSkeleton = () => (
  <div className="client-card skeleton-wrap">
    <Skeleton style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
    <div className="client-info">
      <Skeleton className="skeleton-text" style={{ width: 130, height: 14, marginBottom: 6 }} />
      <Skeleton className="skeleton-text" style={{ width: 100, marginBottom: 4 }} />
      <Skeleton className="skeleton-text" style={{ width: 150 }} />
    </div>
    <div className="client-actions">
      <Skeleton style={{ width: 34, height: 30, borderRadius: 8 }} />
      <Skeleton style={{ width: 90, height: 30, borderRadius: 8 }} />
    </div>
  </div>
);

export const DetailCardSkeleton = () => (
  <div className="detail-card skeleton-wrap">
    <Skeleton className="skeleton-text" style={{ width: '40%', height: 16, marginBottom: 12 }} />
    <Skeleton className="skeleton-text" style={{ width: '70%', marginBottom: 8 }} />
    <Skeleton className="skeleton-text" style={{ width: '55%', marginBottom: 8 }} />
    <Skeleton className="skeleton-text" style={{ width: '60%' }} />
  </div>
);

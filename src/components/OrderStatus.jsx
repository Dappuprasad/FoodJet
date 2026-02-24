function OrderStatus({ currentStatus, statusIndex }) {
    const statuses = [
        { label: 'Order Received', icon: '📋', key: 'received' },
        { label: 'Preparing', icon: '👨‍🍳', key: 'preparing' },
        { label: 'Out for Delivery', icon: '🏍️', key: 'delivery' },
        { label: 'Delivered', icon: '✅', key: 'delivered' },
    ];

    return (
        <div className="status-stepper">
            {statuses.map((status, index) => {
                let stepClass = 'status-step';
                if (index < statusIndex) stepClass += ' completed';
                else if (index === statusIndex) stepClass += ' active';

                return (
                    <div key={status.key} className={stepClass}>
                        <div className="status-icon">{status.icon}</div>
                        <span className="status-label">{status.label}</span>
                    </div>
                );
            })}
        </div>
    );
}

export default OrderStatus;

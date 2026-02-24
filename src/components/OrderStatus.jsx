const STEPS = [
    { label: 'Order Received', icon: '📋' },
    { label: 'Preparing', icon: '👨‍🍳' },
    { label: 'Out for Delivery', icon: '🏍️' },
    { label: 'Delivered', icon: '✅' },
];

function OrderStatus({ statusIndex }) {
    return (
        <div className="status-stepper">
            {STEPS.map((step, i) => (
                <div
                    key={step.label}
                    className={`status-step ${i < statusIndex ? 'completed' : ''} ${i === statusIndex ? 'active' : ''}`}
                >
                    <div className="status-icon">{step.icon}</div>
                    <span className="status-label">{step.label}</span>
                </div>
            ))}
        </div>
    );
}

export default OrderStatus;

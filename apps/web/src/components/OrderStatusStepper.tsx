import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  orderStatusStep,
  type OrderStatus,
} from '@foodjet/shared';

const STEP_ICONS: Record<string, string> = {
  RECEIVED: '📋',
  PREPARING: '👨‍🍳',
  OUT_FOR_DELIVERY: '🏍️',
  DELIVERED: '✅',
};

interface OrderStatusStepperProps {
  status: OrderStatus;
}

export function OrderStatusStepper({ status }: OrderStatusStepperProps) {
  if (status === 'CANCELLED') {
    return (
      <div className="status-cancelled" role="status">
        <span className="status-cancelled-icon">✕</span>
        <div>
          <strong>Order cancelled</strong>
          <p>This order was cancelled and will not be delivered.</p>
        </div>
      </div>
    );
  }

  const currentStep = orderStatusStep(status);

  return (
    <ol className="status-stepper" aria-label="Order progress">
      {ORDER_STATUS_FLOW.map((step, index) => {
        const state =
          index < currentStep ? 'completed' : index === currentStep ? 'active' : 'pending';

        return (
          <li
            key={step}
            className={`status-step ${state}`}
            aria-current={state === 'active' ? 'step' : undefined}
          >
            <div className="status-icon" aria-hidden="true">
              {STEP_ICONS[step]}
            </div>
            <span className="status-label">{ORDER_STATUS_LABELS[step]}</span>
          </li>
        );
      })}
    </ol>
  );
}

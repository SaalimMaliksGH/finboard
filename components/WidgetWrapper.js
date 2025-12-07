'use client';
import { useDrag, useDrop } from 'react-dnd';
import { useRef } from 'react';

// Define the drag item type
const ItemTypes = {
  WIDGET: 'widget',
};

export default function WidgetWrapper({ id, children, className, index, onMove }) {
  const ref = useRef(null);

  // 1. Drop handler (when another widget is dragged over this one)
  const [, drop] = useDrop({
    accept: ItemTypes.WIDGET,
    hover(item, monitor) {
      if (!ref.current) return;
      const dragId = item.id;
      const hoverId = id;
      if (dragId === hoverId) return;

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Get mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // Dragging downwards
      if (item.index < index && hoverClientY < hoverMiddleY) return;

      // Dragging upwards
      if (item.index > index && hoverClientY > hoverMiddleY) return;

      // Time to actually perform the action
      if (onMove) onMove(dragId, hoverId);

      // Note: we're modifying the item here, which is a common practice in react-dnd examples
      item.index = index;
    },
  });

  // 2. Drag handler (when this widget is being dragged)
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.WIDGET,
    item: () => ({ id, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0.4 : 1;

  return (
    <div
      ref={(node) => {
        ref.current = node;
        drag(drop(node));
      }}
      style={{ opacity }}
      className={`relative bg-slate-900 shadow-xl rounded-lg border border-slate-700 transition-all hover:shadow-2xl ${className} cursor-move overflow-hidden`}
    >
      {children}
    </div>
  );
}
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: false // Changed to optional because it may be dynamically generated
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  size: {
    type: String,
    required: false
  },
  artUrl: {
    type: String,
    required: false
  }
});

const orderSchema = new mongoose.Schema({
  paypalOrderId: {
    type: String,
    required: false, // Changed to optional because it may be dynamically generated
    unique: true
  },
  paypalCaptureId: {
    type: String,
    required: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Changed to optional because it may be obtained from token
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0.01
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'CANCELLED', 'FAILED'],
    default: 'PENDING'
  },
  shippingAddress: {
    fullName: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    phone: String
  },
  paymentDetails: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    required: false
  }
});

// Index optimization
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ paypalOrderId: 1 });
orderSchema.index({ status: 1 });

// Virtual field: total order items
orderSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Method: check if order can be cancelled
orderSchema.methods.canCancel = function() {
  return this.status === 'PENDING';
};

// Method: format order amount
orderSchema.methods.formatAmount = function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency
  }).format(this.totalAmount);
};

const Order = mongoose.model('Order', orderSchema);

export default Order;
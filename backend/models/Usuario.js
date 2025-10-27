const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, trim: true },
  email:  { type: String, required: true, unique: true, lowercase: true },
  password:{ type: String, required: true, minlength: 6 },
  rol:     { type: String, enum: ['user','admin'], default: 'user' }
}, { timestamps: true });

usuarioSchema.pre('save', async function(next){
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

usuarioSchema.methods.compararPassword = function(cand){
  return bcrypt.compare(cand, this.password);
};

module.exports = mongoose.model('Usuario', usuarioSchema);

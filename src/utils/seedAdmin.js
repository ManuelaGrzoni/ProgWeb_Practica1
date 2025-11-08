import User from '../models/User.js';

export async function seedAdmin() {
  const exists = await User.findOne({ role: 'admin' });
  if (!exists) {
    await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    });
    console.log('Usuario admin creado: admin@example.com / admin123');
  }
}
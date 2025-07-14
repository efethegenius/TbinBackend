import bcrypt from 'bcryptjs';
import supabase from '../config/supabase.js';

class AdminService {
  static async findAdminByEmail(email) {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error finding admin by email:', error);
      return null;
    }
  }

  static async findAdminById(id) {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error finding admin by ID:', error);
      return null;
    }
  }

  static async updateLastLogin(id) {
    try {
      const { error } = await supabase
        .from('admins')
        .update({ last_login: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  static async createAdmin(adminData) {
    try {
      const hashedPassword = await bcrypt.hash(adminData.password, 10);
      
      const { data, error } = await supabase
        .from('admins')
        .insert([{
          name: adminData.name,
          email: adminData.email,
          password_hash: hashedPassword,
          role: adminData.role || 'admin'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating admin:', error);
      throw error;
    }
  }
}

export default AdminService;
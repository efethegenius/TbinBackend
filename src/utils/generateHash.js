import bcrypt from 'bcryptjs';

// Generate a proper hash for 'password123'
const generateProperHash = async () => {
  const password = 'password123';
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  console.log('Password:', password);
  console.log('Generated hash:', hash);
  
  // Verify it works
  const isValid = await bcrypt.compare(password, hash);
  console.log('Verification test:', isValid);
  
  return hash;
};

generateProperHash();
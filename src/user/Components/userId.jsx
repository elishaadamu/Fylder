const SECRET_KEY = import.meta.env.VITE_APP_SECRET_KEY;

function decryptData(ciphertext) {
  if (!ciphertext) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}
// Get userId from encrypted localStorage
let userId = null;
try {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    const userObj = decryptData(userStr);
    userId = userObj?._id || userObj?.id;
  }
} catch (error) {}

import axios from 'axios';
import { config } from '../config/credentials.js';

export async function Log(stack, level, pkg, message) {
  try {
    const res = await axios.post(
      config.LOG_URL,
      {
        stack,
        level,
        package: pkg,
        message
      },
      {
        headers: {
          Authorization: `Bearer ${config.ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(`📝 Log Success → ID: ${res.data.logID}`);
  } catch (err) {
    console.error('❌ Log failed:', err.response?.data || err.message);
  }
}

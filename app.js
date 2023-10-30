const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const otpGenerator = require('otp-generator');
import emailjs from "@emailjs/browser";

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/otp_demo', {

  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB successfully!');
});

// Create a schema for storing OTPs
const otpSchema = new mongoose.Schema({
  identifier: String,
  otp: String,
  
});

const OTP = mongoose.model('otps', otpSchema);

const transporter = nodemailer.createTransport({
  service: '', 
  auth: {
    user: '',
    pass: '',
  },
});

app.use(bodyParser.json());

// Generate and send OTP
app.post('/api/generate-otp', async (req, res) => {
  const { identifier } = req.body;
  const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });

  try {
    const existingOtp = await OTP.findOne({ identifier }).exec();

    if (existingOtp) {
      existingOtp.otp = otp;
      await existingOtp.save();
    } else {
      const newOtp = new OTP({ identifier, otp });
      await newOtp.save();
    }

    const mailOptions = {
      from: '',
      to: identifier,
      subject: 'Your OTP',
      text: `Your OTP is: ${otp}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to send OTP via email' });
      } else {
        console.log('Email sent: ' + info.response);
        res.json({ message: 'OTP generated and sent successfully' });
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to generate OTP' });
  }
});

// Validate OTP
app.post('/api/validate-otp', async (req, res) => {
  const { identifier, otp } = req.body;

  try {
    const existingOtp = await OTP.findOne({ identifier }).exec();

    if (existingOtp && existingOtp.otp === otp) {
      // You can implement your desired logic here for a successful OTP validation.
      res.json({ message: 'OTP validation successful',existingOtp });
    } else {
      res.status(400).json({ error: 'Invalid OTP' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate OTP' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

import supabase from "../config/supabase.js";
import axios from "axios";
import { Resend } from "resend";
import DonationService from "./DonationService.js";
import nodemailer from "nodemailer";

const resend = new Resend(process.env.RESEND_API_KEY);

class PaymentsService {
  static async verifyAndSave({
    reference,
    userId = userId || null,
    projectId,
    amount,
    email,
    name,
  }) {
    try {
      // Step 1: Verify with Paystack
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = response?.data?.data;

      if (!data || response.status !== 200 || !data.status) {
        return { success: false, message: "Transaction verification failed" };
      }

      // Step 2: Save donation to Supabase
      const donation = await DonationService.createDonation({
        amount,
        currency: "NGN",
        processing_fee: parseInt(data.fees),
        user_id: userId || null,
        project_id: projectId,
        payment_method: "credit_card",
        transaction_id: data.id,
        status: "completed",
        donated_at: data.transaction_date,
        donor_name: name,
      });

      // Step 3: Fetch user email
      console.log("this is email: ", email);

      //     const mailRes = await resend.emails.send({
      //       from: "onboarding@resend.dev",
      //       to: email,
      //       subject: "Thank you for your donation!",
      //       html: `
      // <div style="font-family: Arial, sans-serif; background-color: #f5f9fc; padding: 20px; color: #333;">
      //   <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
      //     <div style="background-color: #e6f0fb; padding: 20px; text-align: center;">
      //       <h1 style="color: #007acc; margin-bottom: 0;">Thank You!</h1>
      //       <p style="margin-top: 5px; color: #444;">Your generosity means the world to us 💙</p>
      //     </div>
      //     <div style="padding: 20px;">
      //       <p>Hi ${name || "there"},</p>
      //       <p>We are thrilled to confirm that we’ve received your donation of <strong>₦${amount}</strong> towards our project. Your support helps us move closer to our goals and create meaningful impact in our community.</p>

      //       <div style="background-color: #f0f8ff; border-left: 4px solid #007acc; padding: 10px 15px; margin: 20px 0; border-radius: 4px;">
      //         <p style="margin: 0;"><strong>Transaction Reference:</strong> ${reference}</p>
      //         <p style="margin: 0;"><strong>Status:</strong> Completed</p>
      //       </div>

      //       <p>Your contribution helps us fund critical initiatives, support those in need, and drive positive change. We will continue to keep you updated on the impact your donation is making.</p>

      //       <p>If you have any questions or would like to get more involved, feel free to reply to this email. We'd love to hear from you!</p>

      //       <p style="margin-top: 30px;">With gratitude,<br/><strong>The Team</strong></p>
      //     </div>
      //     <div style="background-color: #e6f0fb; padding: 15px; text-align: center; font-size: 12px; color: #666;">
      //       <p style="margin: 0;">You're receiving this email because you recently made a donation.</p>
      //       <p style="margin: 0;">© ${new Date().getFullYear()} TBIN</p>
      //     </div>
      //   </div>
      // </div>
      // `,
      //     });

      const transporter = nodemailer.createTransport({
        host: "smtp.zoho.com",
        port: 587,
        secure: false,
        auth: {
          user: "abimbola@thebridgeinternationalnetwork.com",
          pass: "gzH3VDbSp7BL",
        },
      });

      const mailOptions = {
        from: "abimbola@thebridgeinternationalnetwork.com",
        to: "Thebridgeinternationalnetwork@gmail.com",
        subject: "Hello from Zoho",
        html: "<h1>This is from your app</h1>",
      };

      const mailRes = await transporter.sendMail(mailOptions);

      console.log("Mail res: ", mailRes);

      return { success: true, data: donation };
    } catch (error) {
      console.error("Error verifying and saving donation:", error);
      return { success: false, message: "Verification or saving failed" };
    }
  }
}

export default PaymentsService;

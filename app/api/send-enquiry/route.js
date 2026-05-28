import { Resend } from "resend";
import { supabase } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      business_id,
      customer_name,
      company_name,
      email,
      phone,
      message,
      products,
    } = body;

    if (!business_id) {
      return Response.json({ error: "Missing business ID." }, { status: 400 });
    }

    if (!customer_name || (!email && !phone)) {
      return Response.json(
        { error: "Customer name and email or phone are required." },
        { status: 400 }
      );
    }

    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", business_id)
      .maybeSingle();

    if (businessError || !business) {
      return Response.json({ error: "Business not found." }, { status: 404 });
    }

    const { error: dbError } = await supabase.from("enquiries").insert({
      business_id: business.id,
      customer_name,
      company_name,
      email: email || "",
      phone,
      message,
      products,
      status: "new",
    });

    if (dbError) {
      return Response.json({ error: dbError.message }, { status: 500 });
    }

    const productList =
      products?.length > 0
        ? products
            .map(
              (item) =>
                `• ${item.name} | Code: ${item.code || "N/A"} | Qty: ${
                  item.quantity || 1
                }`
            )
            .join("\n")
        : "No products selected.";

    const sendTo = business.contact_email || "lukewalshy1505@gmail.com";

    const businessEmail = await resend.emails.send({
      from: `${business.name} Website <onboarding@resend.dev>`,
      to: [sendTo],
      subject: `New Quote Enquiry - ${business.name}`,
      text: `
New product enquiry received from ${business.name} website.

Customer Details:
Name: ${customer_name}
Company: ${company_name || "N/A"}
Email: ${email || "N/A"}
Phone: ${phone || "N/A"}

Products Requested:
${productList}

Message:
${message || "No message provided."}
      `,
    });

    if (businessEmail.error) {
      return Response.json({ error: businessEmail.error }, { status: 500 });
    }

    if (email) {
      const customerEmail = await resend.emails.send({
        from: `${business.name} Website <onboarding@resend.dev>`,
        to: [email],
        subject: `We received your enquiry - ${business.name}`,
        text: `
Hi ${customer_name},

Thank you for your enquiry. ${business.name} has received your message and will respond with product information, pricing or availability.

Your Requested Products:
${productList}

Your Message:
${message || "No message provided."}

Business Contact:
Email: ${business.contact_email || "Not provided"}
Phone: ${business.phone || "Not provided"}

Kind regards,
${business.name}
      `,
      });

      if (customerEmail.error) {
        return Response.json({ error: customerEmail.error }, { status: 500 });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

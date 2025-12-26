const { emailStyles, logoUrl } = require("../email-helpers");

module.exports = function ({ fullName, code, codeExpirationTimeInMinutes }) {
  if (!fullName || !code || !codeExpirationTimeInMinutes) {
    throw new Error(
      "Missing required data for password reset code email template, expected: fullName, code, codeExpirationTimeInMinutes"
    );
  }

  const emailText = `
    Password Reset Code

    Hello, ${fullName},

    We received a request to reset the password associated with your Gasify account.

    Your password reset code is: ${code}

    This code is valid for ${codeExpirationTimeInMinutes} minutes. If you did not request a password reset, you can safely ignore this message.

    ---
    This is an automated message, please do not reply to this email.

    Thank you,
    Gasify
    `;

  const emailHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${emailStyles.background}" style="background-color:${emailStyles.background}; font-family:Arial, sans-serif;">
      <tr>
        <td align="center" style="padding:40px 0;">
          <table width="480" cellpadding="0" cellspacing="0" border="0" align="center" style="width:480px; max-width:480px;">
            <tr>
              <td>
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td bgcolor="${emailStyles.card}" style="background-color:${emailStyles.card}; border:1px solid ${emailStyles.border}; border-radius:12px; color:${emailStyles.foreground}; font-family:Arial, sans-serif;">

                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="padding:32px 32px 24px 32px;">
                            <img src="${logoUrl}" alt="Gasify" width="${emailStyles.logoHeight}" style="display:block; border:0; outline:none; text-decoration:none; max-width:${emailStyles.logoHeight}px; border-radius:50%; height:auto;" />
                          </td>
                        </tr>
                      </table>

                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="padding:0 32px 32px 32px;">
                            <h2 style="margin:0 0 24px 0; font-size:24px; font-weight:600; color:${emailStyles.primary};">
                              Password Reset Code
                            </h2>

                            <p style="margin:0 0 16px 0; font-size:14px; line-height:1.5;">
                              Hello, ${fullName},
                            </p>

                            <p style="margin:0 0 16px 0; font-size:14px; line-height:1.5;">
                              We received a request to reset the password associated with your Gasify account.
                            </p>

                            <p style="margin:0 0 12px 0; font-size:14px; line-height:1.5;">
                              Your password reset code is:
                            </p>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                              <tr>
                                  <td align="center" bgcolor="${emailStyles.muted}" style="padding:20px; font-size:28px; font-weight:bold; color:${emailStyles.primary}; border:1px solid ${emailStyles.primary}; border-radius:8px;">${code}</td>
                              </tr>
                            </table>

                            <p style="margin:0 0 20px 0; font-size:14px; line-height:1.5;">
                              This code is valid for <strong style="color:${emailStyles.primary};">${codeExpirationTimeInMinutes} minutes</strong>.
                              If you did not request a password reset, you can safely ignore this message.
                            </p>

                            <hr style="border:none; border-top:1px solid ${emailStyles.border}; margin:28px 0;" />

                            <p style="margin:0; font-size:13px; line-height:1.5; color:${emailStyles.mutedForeground};">
                              Thank you,<br />
                              <strong style="color:${emailStyles.foreground};">Gasify</strong>
                            </p>
                          </td>
                        </tr>
                      </table>

                      <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${emailStyles.muted}" style="border-top:1px solid ${emailStyles.border}; border-bottom-left-radius:12px; border-bottom-right-radius:12px;">
                        <tr>
                          <td align="center" style="padding:16px 24px; font-size:12px; line-height:1.4; color:${emailStyles.mutedForeground};">
                            This is an automated message, please do not reply to this email.
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    `;

  return {
    subject: "Password Reset Code",
    text: emailText,
    html: emailHtml,
  };
};

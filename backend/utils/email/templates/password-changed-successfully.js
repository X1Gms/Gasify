const { emailStyles, logoUrl } = require("../email-helpers");

module.exports = function ({ fullName, email, discordUrl }) {
  if (!fullName || !email || !discordUrl) {
    throw new Error(
      "Missing required data for password changed successfully email template, expected: fullName, email, discordUrl"
    );
  }

  const emailText = `
    Password Changed Successfully

    Hello, ${fullName},

    This is a confirmation that the password for your Gasify account has been successfully changed on ${new Date().toLocaleString()}.

    If you made this change, no further action is required.

    SECURITY NOTICE:
    Didn’t change your password?

    If you did not make this change and are unable to access your account, please contact our support team immediately using one of the options below:

    - Email: ${email}
    - Discord: ${discordUrl}

    ---
    This is an automated message, please do not reply to this email.

    Thank you,
    Gasify
    `;

  const emailHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${
      emailStyles.background
    }" style="background-color:${
    emailStyles.background
  }; font-family:Arial, sans-serif;">
        <tr>
            <td align="center" style="padding:40px 0;">
                <table width="480" cellpadding="0" cellspacing="0" border="0" align="center" style="width:480px; max-width:480px;">
                    <tr>
                        <td>
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td bgcolor="${
                                      emailStyles.card
                                    }" style="background-color:${
    emailStyles.card
  }; border:1px solid ${emailStyles.border}; border-radius:12px; color:${
    emailStyles.foreground
  }; font-family:Arial, sans-serif;">

                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td align="center" style="padding:32px 32px 24px 32px;">
                                                    <img src="${logoUrl}" alt="Gasify" width="${
    emailStyles.logoHeight
  }" style="display:block; border:0; outline:none; text-decoration:none; max-width:${
    emailStyles.logoHeight
  }px; border-radius:50%; height:auto;" />
                                                </td>
                                            </tr>
                                        </table>

                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="padding:0 32px 32px 32px;">
                                                    <h2 style="margin:0 0 24px 0; font-size:24px; font-weight:600; color:${
                                                      emailStyles.primary
                                                    };">
                                                        Password Changed Successfully
                                                    </h2>

                                                    <p style="margin:0 0 16px 0; font-size:14px; line-height:1.5;">
                                                        Hello, ${fullName},
                                                    </p>

                                                    <p style="margin:0 0 16px 0; font-size:14px; line-height:1.5;">
                                                        This is a confirmation that the password for your Gasify account has been successfully changed on ${new Date().toLocaleString()}.
                                                    </p>

                                                    <p style="margin:0 0 24px 0; font-size:14px; line-height:1.5;">
                                                    If you made this change, no further action is required.
                                                    </p>

                                                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px; background-color:${
                                                      emailStyles.muted
                                                    }; border-radius:8px;">
                                                    <tr>
                                                        <td width="4" bgcolor="${
                                                          emailStyles.primary
                                                        }" style="width:4px; background-color:${
    emailStyles.primary
  }; border-top-left-radius:8px; border-bottom-left-radius:8px;"></td>
                                                        <td style="padding:16px; font-size:14px; line-height:1.5; color:${
                                                          emailStyles.foreground
                                                        };">

                                                        <strong style="color:${
                                                          emailStyles.dangerous
                                                        };">
                                                            Didn’t change your password?
                                                        </strong>

                                                        <br /><br />
                                                        If you did not make this change and are unable to access your account, please contact our support team immediately using one of the options below:

                                                        <ul style="margin:12px 0 0 18px; padding:0;">
                                                            <li>
                                                                Email:
                                                                <a href="mailto:${email}" style="color:${
    emailStyles.link
  }; text-decoration:none;">
                                                                    ${email}
                                                                </a>
                                                            </li>
                                                            <li>
                                                                Discord:
                                                                <a href="${discordUrl}" target="_blank" rel="noopener" style="color:${
    emailStyles.link
  }; text-decoration:none;">
                                                                    ${discordUrl}
                                                                </a>
                                                            </li>
                                                        </ul>
                                                        </td>
                                                    </tr>
                                                    </table>

                                                    <hr style="border:none; border-top:1px solid ${
                                                      emailStyles.border
                                                    }; margin:28px 0;" />

                                                    <p style="margin:0; font-size:13px; line-height:1.5; color:${
                                                      emailStyles.mutedForeground
                                                    };">
                                                        Thank you,<br />
                                                        <strong style="color:${
                                                          emailStyles.foreground
                                                        };">Gasify</strong>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>

                                        <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${
                                          emailStyles.muted
                                        }" style="border-top:1px solid ${
    emailStyles.border
  }; border-bottom-left-radius:12px; border-bottom-right-radius:12px;">
                                            <tr>
                                                <td align="center" style="padding:16px 24px; font-size:12px; line-height:1.4; color:${
                                                  emailStyles.mutedForeground
                                                };">
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
    subject: "Password Changed Successfully",
    text: emailText,
    html: emailHtml,
  };
};

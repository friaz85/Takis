<?php

namespace App\Libraries;

class EmailSender
{
    public static function sendEmail($to, $subject, $title, $messageHtml, $actionText = null, $actionUrl = null)
    {
        $email = \Config\Services::email();

        // Use SMTP configuration from .env
        $config['protocol']   = 'smtp';
        $config['SMTPHost']   = env('EMAIL_HOST', 'mail.takis.qrewards.com.mx');
        $config['SMTPUser']   = env('EMAIL_USERNAME', 'no-reply@takis.qrewards.com.mx');
        $config['SMTPPass']   = env('EMAIL_PASSWORD', 'Takis2026!');
        $config['SMTPPort']   = env('EMAIL_PORT', 465);
        $config['SMTPCrypto'] = env('EMAIL_SMTP_CRYPTO', 'ssl');

        $config['mailType'] = 'html';
        $config['charset']  = 'utf-8';
        $config['wordWrap'] = true;
        $config['newline']  = "\r\n";
        $config['CRLF']     = "\r\n";

        $email->initialize($config);

        $fromEmail = env('EMAIL_FROM', 'no-reply@takis.qrewards.com.mx');
        $fromName  = env('EMAIL_FROM_NAME', 'Takis Promo');

        $email->setFrom($fromEmail, $fromName);
        $email->setTo($to);
        $email->setSubject($subject);

        $html = self::buildHtml($title, $messageHtml, $actionText, $actionUrl);

        $email->setMessage($html);

        if ($email->send()) {
            return true;
        } else {
            // Log error but don't crash app if possible, or debug
            log_message('error', 'Email Error: ' . $email->printDebugger(['headers']));
            return false;
        }
    }

    private static function buildHtml($title, $message, $btnText, $btnUrl)
    {
        $primaryColor = '#6C1DDA';
        $accentColor  = '#F2E74B';
        $bgColor      = '#1A0B2E';
        $cardColor    = '#25163A';

        // Use the new Banderin logo
        $logoUrl = 'https://dev.takisaficionintensa.com.mx/assets/img/Banderin-completo.png';

        $year = date('Y');

        // Logic outside Heredoc
        $buttonHtml = '';
        if ($btnText) {
            $url        = $btnUrl ?: '#';
            $buttonHtml = "
            <table role='presentation' cellspacing='0' cellpadding='0' border='0' style='margin: 0 auto;'>
                <tr>
                    <td style='border-radius: 50px; background-color: $accentColor;'>
                        <a href='$url' style='display: inline-block; padding: 14px 40px; color: #1A0B2E; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 50px; text-transform: uppercase;'>$btnText</a>
                    </td>
                </tr>
            </table>
            ";
        }

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>$title</title>
</head>
<body style="margin: 0; padding: 0; background-color: $bgColor; font-family: Arial, sans-serif; color: #ffffff;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: $bgColor;">
        <tr>
            <td align="center" style="padding: 40px 10px;">
                <!-- Card Container -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: $cardColor; border-radius: 16px; border: 1px solid #442a66; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                    <!-- Header with Logo -->
                    <tr>
                        <td align="center" style="padding: 30px; background-color: #120621; border-bottom: 1px solid #442a66;">
                            <img src="$logoUrl" alt="Takis" width="150" style="display: block; border: 0;">
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px; text-align: center;">
                            <h1 style="color: $accentColor; font-size: 24px; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 1px;">$title</h1>
                            
                            <div style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                                $message
                            </div>

                            $buttonHtml
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px; background-color: #120621; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #442a66;">
                            <p style="margin: 0;">&copy; $year Takis Promo. Todos los derechos reservados.</p>
                            <p style="margin: 5px 0 0 0;">Si no solicitaste este correo, puedes ignorarlo.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;
    }
}

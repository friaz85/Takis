<?php

namespace App\Libraries;

class EmailSender
{
    private static function removeAccents($string)
    {
        // USER REQUESTED TO HAVE ACCENTS BACK
        return $string;
    }

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

        $email->setFrom($fromEmail, self::removeAccents($fromName));
        $email->setTo($to);
        $email->setSubject(self::removeAccents($subject));

        // Clean message content
        $cleanTitle = self::buildHtml($title, $messageHtml, $actionText, $actionUrl); // We pass raw here, buildHtml will clean it? No, let's clean before
        // Actually, messageHtml might contain HTML tags. We should only clean text content, but that's hard. 
        // The user request is "quitar los acentos". 
        // Simple str_replace on the whole HTML might break attributes if they had accents (unlikely for standard tags).
        // Let's assume messageHtml is mostly text provided by us.

        // Re-implementing logic to be cleaner:
        $cleanTitleText   = self::removeAccents($title);
        $cleanMessageHtml = self::removeAccents($messageHtml);
        $cleanActionText  = $actionText ? self::removeAccents($actionText) : null;

        $html = self::buildHtml($cleanTitleText, $cleanMessageHtml, $cleanActionText, $actionUrl);

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

        // User requested to remove buttons
        $buttonHtml = '';

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>$title</title>
    <style>
        @font-face {
            font-family: 'Veneer';
            src: url('https://dev.takisaficionintensa.com.mx/assets/fonts/Veneer.otf') format('opentype');
            font-weight: normal;
            font-style: normal;
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: $bgColor; background-image: url('https://dev.takisaficionintensa.com.mx/assets/img/BG_takis.jpg'); background-size: cover; background-position: center; font-family: 'Veneer', 'Arial Black', Impact, sans-serif; color: #ffffff;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-image: url('https://dev.takisaficionintensa.com.mx/assets/img/BG_takis.jpg'); background-size: cover; background-position: center; background-color: $bgColor;">
        <tr>
            <td align="center" style="padding: 40px 10px;">
                <!-- Card Container -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: rgba(37, 22, 58, 0.9); border-radius: 16px; border: 1px solid #442a66; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                    <!-- Header with Logos -->
                    <tr>
                        <td align="center" style="padding: 30px; background-color: rgba(18, 6, 33, 0.11); border-bottom: 2px solid #442a66;">
                            <img src="https://dev.takisaficionintensa.com.mx/assets/img/Banderin_01.png" alt="Takis 1" width="190" style="display: inline-block; vertical-align: middle; border: 0; margin-right: 10px;">
                            <img src="https://dev.takisaficionintensa.com.mx/assets/img/Banderin_02.png" alt="Takis 2" width="190" style="display: inline-block; vertical-align: middle; border: 0; margin-left: 10px;">
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
                        <td style="padding: 20px; background-color: rgba(18, 6, 33, 0.95); text-align: center; color: #ffffff; font-size: 12px; border-top: 1px solid #442a66;">
                            <p style="margin: 0;">&copy; $year TAKIS: La promo de la afición más intensa. Todos los derechos reservados.</p>
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

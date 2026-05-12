<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $title ?></title>
    <style>
        @font-face {
            font-family: 'Veneer';
            src: url('https://dev.takisaficionintensa.com.mx/assets/fonts/Veneer.otf') format('opentype');
            font-weight: normal;
            font-style: normal;
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #1A0B2E; background-image: url('https://dev.takisaficionintensa.com.mx/assets/img/BG_takis.jpg'); background-size: cover; background-position: center; font-family: 'Arial Black', Impact, sans-serif; color: #ffffff;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-image: url('https://dev.takisaficionintensa.com.mx/assets/img/BG_takis.jpg'); background-size: cover; background-position: center; background-color: #1A0B2E;">
        <tr>
            <td align="center" style="padding: 40px 10px;">
                <!-- Card Container -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: rgba(37, 22, 58, 0.9); border-radius: 16px; border: 1px solid #442a66; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                    <!-- Header with Logo -->
                    <tr>
                        <td align="center" style="padding: 30px; background-color: rgba(18, 6, 33, 0.11); border-bottom: 2px solid #442a66;">
                            <img src="https://dev.takisaficionintensa.com.mx/assets/img/Banderin_01.png" alt="Takis" width="220" style="display: block; border: 0; margin: 0 auto;">
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px; text-align: center;">
                            <h1 style="color: #F2E74B; font-size: 28px; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 1px;"><?= $title ?></h1>
                            
                            <div style="color: #e0e0e0; font-size: 18px; line-height: 1.6; margin-bottom: 30px;">
                                <?= $message ?>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px; background-color: rgba(18, 6, 33, 0.95); text-align: center; color: #ffffff; font-size: 12px; border-top: 1px solid #442a66;">
                            <p style="margin: 0;">&copy; <?= date('Y') ?> TAKIS: La promo de la afición más intensa. Todos los derechos reservados.</p>
                            <p style="margin: 5px 0 0 0;">Si no solicitaste este correo, puedes ignorarlo.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

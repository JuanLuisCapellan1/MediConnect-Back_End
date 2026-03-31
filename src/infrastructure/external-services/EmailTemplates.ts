/**
 * EmailTemplates.ts
 *
 * Templates HTML premium para los correos de MediConnect.
 * Paleta de colores del sistema:
 *   Deep Forest Green  #092610
 *   Soft Sage          #D7E3C9
 *   Dusty Blue         #8BB1CA
 *   Pale Herbal Cream  #EFF2D7
 *   White              #FFFFFF
 */

// ─── Layout base ─────────────────────────────────────────────────────────────

function baseLayout(accentColor: string, contenido: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>MediConnect</title>
</head>
<body style="margin:0; padding:0; background-color:#F4F6F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
    style="background-color:#F4F6F0; min-height:100vh;">
    <tr>
      <td align="center" style="padding: 48px 16px 40px;">

        <!-- Tarjeta principal -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
          style="max-width:560px;">

          <!-- Logo / cabecera -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="
                    background-color: #092610;
                    border-radius: 14px;
                    padding: 14px 28px;
                  ">
                    <span style="
                      font-size: 20px;
                      font-weight: 700;
                      color: #FFFFFF;
                      letter-spacing: 0.5px;
                    ">MediConnect</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Cuerpo de la tarjeta -->
          <tr>
            <td style="
              background-color: #FFFFFF;
              border-radius: 20px;
              box-shadow: 0 2px 20px rgba(9,38,16,0.07);
              overflow: hidden;
            ">
              <!-- Banda de acento superior -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color: ${accentColor}; height: 4px; font-size: 1px; line-height: 1px;">&nbsp;</td>
                </tr>
              </table>

              <!-- Contenido inyectado -->
              ${contenido}

              <!-- Pie de la tarjeta -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 0 40px;">
                    <div style="height: 1px; background-color: #EFF2D7;"></div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 40px 28px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #9AA694; line-height: 1.6;">
                      Este mensaje fue generado automáticamente. Por favor, no respondas a este correo.
                    </p>
                    <p style="margin: 8px 0 0; font-size: 11px; color: #C0CAB9;">
                      © 2025 MediConnect — Sistema de Salud Digital.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Bloque visual del código OTP ────────────────────────────────────────────

function otpBlock(codigo: string): string {
  const digitos = codigo.split('');
  const celdas = digitos
    .map(d => `
      <td style="
        display: inline-block;
        width: 40px;
        height: 52px;
        line-height: 52px;
        text-align: center;
        background-color: #F4F6F0;
        border-radius: 10px;
        font-size: 26px;
        font-weight: 700;
        color: #092610;
        margin: 0 3px;
        letter-spacing: 0;
      ">${d}</td>
    `)
    .join('');
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
      <tr>${celdas}</tr>
    </table>
  `;
}

// ─── Bloque de cuenta regresiva visual ───────────────────────────────────────

function expiryBadge(): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center"
      style="margin-top: 20px;">
      <tr>
        <td style="
          background-color: #EFF2D7;
          border-radius: 30px;
          padding: 8px 18px;
        ">
          <span style="font-size: 13px; color: #5C7356; font-weight: 600;">
            ⏱ Válido por 15 minutos
          </span>
        </td>
      </tr>
    </table>
  `;
}

// ─── Template: Código de registro ────────────────────────────────────────────

export function templateCodigoRegistro(codigo: string): string {
  const contenido = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">

      <!-- Ícono y título -->
      <tr>
        <td style="padding: 40px 40px 8px; text-align: center;">
          <div style="
            width: 64px; height: 64px; margin: 0 auto 20px;
            background-color: #EFF2D7;
            border-radius: 50%;
            font-size: 28px;
            line-height: 64px;
            text-align: center;
          ">✉️</div>
          <h1 style="
            margin: 0;
            font-size: 22px;
            font-weight: 700;
            color: #092610;
            line-height: 1.3;
          ">Verifica tu correo</h1>
          <p style="
            margin: 12px 0 0;
            font-size: 15px;
            color: #5C7356;
            line-height: 1.6;
          ">
            Usa el siguiente código para completar<br>tu registro en MediConnect.
          </p>
        </td>
      </tr>

      <!-- Código OTP -->
      <tr>
        <td style="padding: 32px 40px 8px; text-align: center;">
          ${otpBlock(codigo)}
          ${expiryBadge()}
        </td>
      </tr>

      <!-- Aviso de seguridad -->
      <tr>
        <td style="padding: 24px 40px 36px; text-align: center;">
          <p style="
            margin: 0;
            font-size: 13px;
            color: #9AA694;
            line-height: 1.6;
            max-width: 360px;
            margin: 0 auto;
          ">
            Si no solicitaste este código, ignora este mensaje. Tu cuenta está segura.
          </p>
        </td>
      </tr>

    </table>
  `;
  return baseLayout('#092610', contenido);
}

// ─── Template: Recuperación de contraseña ────────────────────────────────────

export function templateRecuperacionPassword(codigo: string): string {
  const contenido = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">

      <!-- Ícono y título -->
      <tr>
        <td style="padding: 40px 40px 8px; text-align: center;">
          <div style="
            width: 64px; height: 64px; margin: 0 auto 20px;
            background-color: #EFF2D7;
            border-radius: 50%;
            font-size: 28px; line-height: 64px; text-align: center;
          ">🔐</div>
          <h1 style="
            margin: 0;
            font-size: 22px;
            font-weight: 700;
            color: #092610;
            line-height: 1.3;
          ">Restablecer contraseña</h1>
          <p style="
            margin: 12px 0 0;
            font-size: 15px;
            color: #5C7356;
            line-height: 1.6;
          ">
            Recibimos una solicitud para cambiar la contraseña<br>de tu cuenta en MediConnect.
          </p>
        </td>
      </tr>

      <!-- Código OTP -->
      <tr>
        <td style="padding: 32px 40px 8px; text-align: center;">
          ${otpBlock(codigo)}
          ${expiryBadge()}
        </td>
      </tr>

      <!-- Alerta de seguridad -->
      <tr>
        <td style="padding: 24px 40px 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="
                background-color: #FFF8EE;
                border-left: 3px solid #E8A838;
                border-radius: 8px;
                padding: 14px 18px;
              ">
                <p style="margin: 0; font-size: 13px; color: #7A5A1A; line-height: 1.6;">
                  <strong>⚠️ Seguridad:</strong> Si no solicitaste este cambio, cambia tu contraseña inmediatamente y contacta a soporte.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td style="padding: 0 40px 36px; text-align: center;">
          <p style="
            margin: 16px auto 0;
            font-size: 13px;
            color: #9AA694;
            line-height: 1.6;
            max-width: 360px;
          ">
            Este código es de un solo uso y expira en 15 minutos.
          </p>
        </td>
      </tr>

    </table>
  `;
  return baseLayout('#8BB1CA', contenido);
}

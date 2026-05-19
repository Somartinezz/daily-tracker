require('dotenv').config();
const db = require('./db');

const REGLAS = [
  {
    categoria: 'Correo / Outlook',
    keywords: ['outlook','correo','mail','email','bandeja','firma','calendario','teams','meeting','reunion','reunión','invitación','invitacion','microsoft','exchange','smtp','imap','adjunto','mensaje','inbox','spam','distribution','grupo de correo','lista de distribución']
  },
  {
    categoria: 'Equipos / Hardware',
    keywords: ['notebook','laptop','computadora','computadoras','pc','equipo','celular','teléfono','telefono','auricular','headset','teclado','mouse','ratón','monitor','pantalla','impresora','escaner','scanner','disco','ram','memoria','batería','bateria','cargador','cable','usb','hdmi','docking','hub','camara','cámara','webcam','microfono','micrófono','cambio de equipo','reemplazo','formatear','formato','hardware']
  },
  {
    categoria: 'Accesos / Permisos',
    keywords: ['contraseña','password','clave','acceso','permiso','permisos','usuario','cuenta','cuenta de','active directory','ad','vpn','token','mfa','autenticación','autenticacion','2fa','bloqueo','bloqueado','bloqueada','desbloqueo','desbloquear','login','ingresar','no puede entrar','no entra','no accede','resetear','reset','expiró','expiro','vencio','venció','alta de usuario','baja de usuario','nuevo usuario','nueva cuenta','carpeta compartida','carpeta de red','drive','unidad de red','share','permisos de carpeta']
  },
  {
    categoria: 'Software / Sistema',
    keywords: ['windows','office','excel','word','powerpoint','ppt','pdf','adobe','chrome','firefox','navegador','browser','programa','aplicación','aplicacion','software','instalación','instalacion','instalar','actualización','actualizacion','actualizar','sistema operativo','so','driver','controlador','error del sistema','pantalla azul','bsod','virus','antivirus','malware','licencia','activación','activacion','sap','erp','crm','visio','teams','zoom','slack','autocad','java','python','7zip','winrar','script','macro','vba']
  },
  {
    categoria: 'Red / Conectividad',
    keywords: ['internet','red','wifi','wi-fi','wireless','ethernet','cable de red','conexión','conexion','conectividad','vpn','ping','lento','lenta','sin internet','sin conexion','sin conexión','router','switch','firewall','proxy','dns','ip','dirección ip','red caída','red caida','no conecta','no se conecta','no tiene red','no hay internet']
  }
];

function clasificar(texto) {
  const t = texto.toLowerCase();
  for (const regla of REGLAS) {
    if (regla.keywords.some(k => t.includes(k))) {
      return regla.categoria;
    }
  }
  return 'Otros';
}

async function main() {
  const { rows } = await db.query("SELECT id, texto, categoria FROM tareas ORDER BY creada_en ASC");

  let actualizadas = 0;
  let yaCategorizadas = 0;

  for (const tarea of rows) {
    if (tarea.categoria && tarea.categoria.trim() !== '') {
      yaCategorizadas++;
      continue;
    }
    const cat = clasificar(tarea.texto);
    await db.query("UPDATE tareas SET categoria=$1 WHERE id=$2", [cat, tarea.id]);
    console.log(`[${cat}] ${tarea.texto.slice(0, 60)}`);
    actualizadas++;
  }

  console.log(`\n✓ ${actualizadas} tareas categorizadas, ${yaCategorizadas} ya tenían categoría.`);
  await db.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });

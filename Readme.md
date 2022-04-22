Frontend colectivo abierto
Estado de dependencia Crowdin

Babel - Colectivo Abierto

Prefacio
Si ve un paso a continuación que podría mejorarse (o está desactualizado), actualice las instrucciones. Rara vez pasamos por este proceso nosotros mismos, por lo que su nuevo par de ojos y su experiencia reciente lo convierten en el mejor candidato para mejorarlos para otros usuarios. ¡Gracias!

Desarrollo
Requisito previo
Asegúrese de tener la versión 14.x de Node.js y la versión 6.x de NPM. La versión 7 de NPM actualmente no es compatible porque cambia el contenido del archivo de bloqueo; consulte el problema n.º 4177 para obtener más información.
Recomendamos usar nvm : nvm use.
Instalar
Recomendamos clonar el repositorio en una carpeta dedicada a opencollectiveproyectos.

git clone git@github.com:opencollective/opencollective-frontend.git opencollective/frontend
cd opencollective/frontend
npm install
Variables de entorno
Este proyecto requiere acceso a la API de Open Collective.

De manera predeterminada, intentará conectarse a la API de prueba de Open Collective, no tiene que cambiar nada .

En caso de que desee conectarse a la API de Open Collective que se ejecuta localmente:

clonar, instalar e iniciar opencollective-api
en este proyecto, copie el siguiente contenido en un .envarchivo:
API_URL=http://localhost:3060
API_KEY=dvl-1510egmf4a23d80342403fb599qd
Comienzo
npm run dev
Pruebas
Para ejecutar las pruebas:

para uso de páginas y componentesnpm test
para pruebas de extremo a extremo (e2e) con Cypress , consulte nuestra guía dedicada .
Actualizar:

Instantáneas de Jest: ejecutarnpm run test:update
Archivos de traducción: ejecutarnpm run langs:update
Esquema GraphQL para ESLint: ejecutarnpm run graphql:update
Guía de estilo
Usamos Storybook para desarrollar y documentar nuestros componentes React de forma aislada con componentes con estilo y sistema con estilo .

Más información: docs/styleguide.md

Localización
Traducir la interfaz no requiere ninguna habilidad técnica, puede ir a https://crowdin.com/project/opencollective y comenzar a traducir de inmediato.

Actualmente estamos buscando contribuciones para los siguientes idiomas:

Francés
español
japonés
¿Quiere agregar un nuevo idioma para Open Collective? ¡Contáctanos , estaremos encantados de ayudarte a configurarlo!

contribuyendo

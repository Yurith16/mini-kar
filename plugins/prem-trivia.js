import { saveDatabase } from '../lib/db.js'
import { checkReg } from '../lib/checkReg.js'

const triviaData = {
    'cultura': [
    { q: '¿Cuál es el río más largo del mundo?', a: 'Amazonas', opciones: ['Nilo', 'Amazonas', 'Misisipi', 'Yangtsé', 'Danubio', 'Rhin'] },
    { q: '¿En qué país se encuentra la Torre de Pisa?', a: 'Italia', opciones: ['Francia', 'España', 'Italia', 'Grecia', 'Portugal', 'Bélgica'] },
    { q: '¿Quién pintó la "Mona Lisa"?', a: 'Leonardo da Vinci', opciones: ['Van Gogh', 'Picasso', 'Leonardo da Vinci', 'Dalí', 'Rembrandt', 'Monet'] },
    { q: '¿Cuál es el país más pequeño del mundo?', a: 'Vaticano', opciones: ['Mónaco', 'Vaticano', 'Andorra', 'San Marino', 'Malta', 'Liechtenstein'] },
    { q: '¿Qué ciudad es conocida como la "Gran Manzana"?', a: 'Nueva York', opciones: ['Chicago', 'Los Ángeles', 'Nueva York', 'Londres', 'París', 'Tokio'] },
    { q: '¿Cuál es el idioma más hablado del mundo?', a: 'Chino Mandarín', opciones: ['Español', 'Inglés', 'Chino Mandarín', 'Hindi', 'Árabe', 'Ruso'] },
    { q: '¿Quién escribió "Cien años de soledad"?', a: 'Gabriel García Márquez', opciones: ['Vargas Llosa', 'Gabriel García Márquez', 'Isabel Allende', 'Neruda', 'Borges', 'Cortázar'] },
    { q: '¿En qué país se originaron los Juegos Olímpicos?', a: 'Grecia', opciones: ['Italia', 'Grecia', 'Egipto', 'Francia', 'China', 'México'] },
    { q: '¿Qué país tiene forma de bota?', a: 'Italia', opciones: ['Grecia', 'Italia', 'España', 'México', 'Noruega', 'Japón'] },
    { q: '¿Cuál es la moneda oficial de Japón?', a: 'Yen', opciones: ['Won', 'Yuan', 'Yen', 'Dólar', 'Euro', 'Peso'] },
    { q: '¿Cuál es el océano más grande del mundo?', a: 'Pacífico', opciones: ['Atlántico', 'Índico', 'Ártico', 'Pacífico', 'Antártico', 'Muerto'] },
    { q: '¿Quién es el autor de "La noche estrellada"?', a: 'Vincent van Gogh', opciones: ['Claude Monet', 'Vincent van Gogh', 'Salvador Dalí', 'Picasso', 'Renoir', 'Degas'] },
    { q: '¿En qué continente se encuentra el desierto del Sahara?', a: 'África', opciones: ['Asia', 'África', 'América', 'Oceanía', 'Europa', 'Antártida'] },
    { q: '¿Cuál es la capital de Francia?', a: 'París', opciones: ['Lyon', 'Marsella', 'París', 'Burdeos', 'Niza', 'Estrasburgo'] },
    { q: '¿Qué país regaló la Estatua de la Libertad a EE.UU.?', a: 'Francia', opciones: ['España', 'Reino Unido', 'Francia', 'Alemania', 'Italia', 'Canadá'] }
],
    'peliculas': [
    { q: '¿Quién dirigió "Oppenheimer"?', a: 'Christopher Nolan', opciones: ['Spielberg', 'Christopher Nolan', 'Scorsese', 'Tarantino', 'James Cameron', 'Greta Gerwig'] },
    { q: '¿Qué película ganó el primer Óscar de la historia?', a: 'Wings', opciones: ['Wings', 'Metrópolis', 'Sunrise', 'The Circus', 'King Kong', 'Gone with the Wind'] },
    { q: '¿Cómo se llama el reino de Black Panther?', a: 'Wakanda', opciones: ['Asgard', 'Wakanda', 'Talokan', 'Sokovia', 'Latveria', 'Atlantis'] },
    { q: '¿Quién interpretó a Jack en "Titanic"?', a: 'Leonardo DiCaprio', opciones: ['Brad Pitt', 'Leonardo DiCaprio', 'Tom Cruise', 'Johnny Depp', 'Matt Damon', 'Will Smith'] },
    { q: '¿Cuál es la película más taquillera de la historia?', a: 'Avatar', opciones: ['Avengers: Endgame', 'Titanic', 'Avatar', 'Star Wars VII', 'Spider-Man: No Way Home', 'The Lion King'] },
    { q: '¿Cómo se llama el elfo doméstico de Harry Potter?', a: 'Dobby', opciones: ['Kreacher', 'Dobby', 'Winky', 'Hokey', 'Griphook', 'Grawp'] },
    { q: '¿Qué actor hace la voz de Woody en Toy Story?', a: 'Tom Hanks', opciones: ['Tim Allen', 'Tom Hanks', 'Robin Williams', 'Jim Carrey', 'Will Ferrell', 'Billy Crystal'] },
    { q: '¿Quién dirigió la película "Parásitos"?', a: 'Bong Joon-ho', opciones: ['Park Chan-wook', 'Bong Joon-ho', 'Kim Jee-woon', 'Ang Lee', 'Akira Kurosawa', 'Hayao Miyazaki'] },
    { q: '¿Cuál es el nombre del villano en "El silencio de los corderos"?', a: 'Hannibal Lecter', opciones: ['Norman Bates', 'Hannibal Lecter', 'Pennywise', 'Freddy Krueger', 'Jason Voorhees', 'Ghostface'] },
    { q: '¿Qué película de Disney tiene a una protagonista llamada Mérida?', a: 'Valiente', opciones: ['Enredados', 'Valiente', 'Frozen', 'Moana', 'Mulan', 'Pocahontas'] },
    { q: '¿Cómo se llama la inteligencia artificial de Iron Man?', a: 'J.A.R.V.I.S.', opciones: ['SIRI', 'ALEXA', 'J.A.R.V.I.S.', 'HAL 9000', 'FRIDAY', 'EDITH'] },
    { q: '¿Cuál es la primera película del universo de Star Wars?', a: 'A New Hope', opciones: ['The Phantom Menace', 'A New Hope', 'The Empire Strikes Back', 'Revenge of the Sith', 'The Force Awakens', 'Rogue One'] },
    { q: '¿Quién interpretó al Joker en "The Dark Knight"?', a: 'Heath Ledger', opciones: ['Joaquin Phoenix', 'Jack Nicholson', 'Heath Ledger', 'Jared Leto', 'Barry Keoghan', 'Mark Hamill'] },
    { q: '¿En qué ciudad vive Batman?', a: 'Gotham', opciones: ['Metrópolis', 'Gotham', 'Central City', 'Star City', 'Nueva York', 'Chicago'] },
    { q: '¿Qué película musical trata sobre una aspirante a actriz y un músico de jazz?', a: 'La La Land', opciones: ['Chicago', 'La La Land', 'Grease', 'Moulin Rouge', 'Sing', 'Cats'] }
],
    'comidas': [
    { q: '¿Cuál es el ingrediente principal del guacamole?', a: 'Aguacate', opciones: ['Tomate', 'Aguacate', 'Cebolla', 'Limón', 'Cilantro', 'Chile'] },
    { q: '¿De qué país es originaria la pizza?', a: 'Italia', opciones: ['EE.UU.', 'Grecia', 'Francia', 'Italia', 'España', 'Turquía'] },
    { q: '¿Qué tipo de pasta tiene forma de cuerdas largas?', a: 'Espagueti', opciones: ['Macarrones', 'Espagueti', 'Penne', 'Fusilli', 'Ravioli', 'Lasaña'] },
    { q: '¿Cuál es el destilado base del Mojito?', a: 'Ron', opciones: ['Tequila', 'Vodka', 'Ron', 'Ginebra', 'Whisky', 'Pisco'] },
    { q: '¿Qué especia le da al curry su color amarillo?', a: 'Cúrcuma', opciones: ['Canela', 'Pimentón', 'Cúrcuma', 'Comino', 'Pimienta', 'Jengibre'] },
    { q: '¿Cómo se llama el arroz japonés usado para el sushi?', a: 'Koshihikari', opciones: ['Basmati', 'Jazmín', 'Koshihikari', 'Arborio', 'Integral', 'Largo'] },
    { q: '¿Qué fruta es conocida como la "reina de las frutas" pero huele mal?', a: 'Durian', opciones: ['Mango', 'Durian', 'Papaya', 'Kiwi', 'Lichi', 'Granada'] },
    { q: '¿De qué animal proviene la carne de "Wagyu"?', a: 'Vaca', opciones: ['Cerdo', 'Vaca', 'Cordero', 'Pato', 'Búfalo', 'Ciervo'] },
    { q: '¿Qué país consume más café por persona?', a: 'Finlandia', opciones: ['Brasil', 'Colombia', 'Finlandia', 'Italia', 'EE.UU.', 'Etiopía'] },
    { q: '¿Qué es el "Kimchi"?', a: 'Col fermentada', opciones: ['Sopa de pescado', 'Col fermentada', 'Pan de arroz', 'Té dulce', 'Carne cruda', 'Postre frito'] },
    { q: '¿Cuál es el ingrediente principal del Hummus?', a: 'Garbanzos', opciones: ['Lentejas', 'Frijoles', 'Garbanzos', 'Habas', 'Guisantes', 'Soja'] },
    { q: '¿Qué hongo es considerado el "diamante de la cocina"?', a: 'Trufa negra', opciones: ['Champiñón', 'Portobello', 'Trufa negra', 'Shiitake', 'Níscalo', 'Boleto'] },
    { q: '¿De qué país es originario el queso Roquefort?', a: 'Francia', opciones: ['Italia', 'Suiza', 'Francia', 'España', 'Holanda', 'Grecia'] },
    { q: '¿Qué tipo de carne se usa tradicionalmente en un "Ceviche"?', a: 'Pescado blanco', opciones: ['Carne de res', 'Pollo', 'Pescado blanco', 'Cerdo', 'Cordero', 'Pato'] },
    { q: '¿Cuál es la base de la sopa japonesa "Ramen"?', a: 'Caldo con fideos', opciones: ['Sopa de arroz', 'Caldo con fideos', 'Puré de verduras', 'Leche de coco', 'Agua con algas', 'Caldo de miso solo'] },
    { q: '¿Qué fruta se usa para hacer la sidra?', a: 'Manzana', opciones: ['Uva', 'Pera', 'Manzana', 'Naranja', 'Cereza', 'Ciruela'] },
    { q: '¿Qué país inventó las papas fritas (French Fries)?', a: 'Bélgica', opciones: ['Francia', 'EE.UU.', 'Bélgica', 'Inglaterra', 'Alemania', 'Canadá'] },
    { q: '¿Qué ingrediente hace que el pan suba?', a: 'Levadura', opciones: ['Azúcar', 'Sal', 'Levadura', 'Huevos', 'Mantequilla', 'Leche'] },
    { q: '¿Cuál es el plato nacional de España?', a: 'Paella', opciones: ['Tortilla', 'Paella', 'Gazpacho', 'Cocido', 'Jamón', 'Churros'] },
    { q: '¿De qué está hecha la Tofu?', a: 'Leche de soja', opciones: ['Queso de cabra', 'Leche de soja', 'Claras de huevo', 'Harina de arroz', 'Maíz prensado', 'Gelatina animal'] }
],
   'biologia': [
    { q: '¿Cuál es el órgano más grande del cuerpo humano?', a: 'Piel', opciones: ['Hígado', 'Piel', 'Corazón', 'Pulmones', 'Cerebro', 'Intestino'] },
    { q: '¿Cuántos corazones tiene un pulpo?', a: '3', opciones: ['1', '2', '3', '4', '5', '8'] },
    { q: '¿Qué parte de la célula contiene el ADN?', a: 'Núcleo', opciones: ['Mitocondria', 'Núcleo', 'Ribosoma', 'Citoplasma', 'Membrana', 'Aparato de Golgi'] },
    { q: '¿Cuál es el único mamífero capaz de volar?', a: 'Murciélago', opciones: ['Ardilla voladora', 'Murciélago', 'Pájaro', 'Avestruz', 'Pingüino', 'Delfín'] },
    { q: '¿Cómo se llama el proceso por el que las plantas hacen comida?', a: 'Fotosíntesis', opciones: ['Respiración', 'Fotosíntesis', 'Osmosis', 'Mitosis', 'Digestión', 'Transpiración'] },
    { q: '¿Cuál es el único mamífero que pone huevos?', a: 'Ornitorrinco', opciones: ['Equidna', 'Ornitorrinco', 'Delfín', 'Murciélago', 'Ballena', 'Canguro'] },
    { q: '¿Cuántos pares de cromosomas tiene un humano?', a: '23', opciones: ['22', '23', '24', '46', '48', '12'] },
    { q: '¿Qué tipo de sangre es el "donante universal"?', a: 'O-', opciones: ['A+', 'B-', 'AB+', 'O+', 'O-', 'AB-'] },
    { q: '¿Cuál es el hueso más pequeño del cuerpo?', a: 'Estribo', opciones: ['Fémur', 'Radio', 'Estribo', 'Falange', 'Rótula', 'Atlas'] },
    { q: '¿Qué animal tiene la mordida más fuerte del mundo?', a: 'Cocodrilo del Nilo', opciones: ['Tiburón Blanco', 'León', 'Hiena', 'Cocodrilo del Nilo', 'Oso Polar', 'Hipopótamo'] },
    { q: '¿Cuál es la función de los glóbulos rojos?', a: 'Transportar oxígeno', opciones: ['Defender el cuerpo', 'Coagular sangre', 'Transportar oxígeno', 'Producir energía', 'Eliminar toxinas', 'Mover músculos'] },
    { q: '¿Qué animal terrestre es el más rápido del mundo?', a: 'Guepardo', opciones: ['León', 'Caballo', 'Guepardo', 'Gacela', 'Tigre', 'Avestruz'] },
    { q: '¿Cuál es el animal más grande que ha existido?', a: 'Ballena Azul', opciones: ['Megalodón', 'Dinosaurio Rex', 'Ballena Azul', 'Mamut', 'Elefante', 'Diplodocus'] },
    { q: '¿Qué parte del ojo detecta el color?', a: 'Conos', opciones: ['Córnea', 'Conos', 'Bastones', 'Iris', 'Pupila', 'Cristalino'] },
    { q: '¿Qué vitamina obtenemos principalmente del Sol?', a: 'Vitamina D', opciones: ['Vitamina A', 'Vitamina C', 'Vitamina D', 'Vitamina B12', 'Vitamina K', 'Vitamina E'] },
    { q: '¿Cuál es la unidad básica de la vida?', a: 'Célula', opciones: ['Átomo', 'Célula', 'Molécula', 'Tejido', 'ADN', 'Bacteria'] },
    { q: '¿Cómo se llama la proteína que da color a la piel?', a: 'Melanina', opciones: ['Queratina', 'Melanina', 'Colágeno', 'Hemoglobina', 'Insulina', 'Miosina'] },
    { q: '¿Qué animal tiene la memoria más larga?', a: 'Elefante', opciones: ['Delfín', 'Elefante', 'Perro', 'Chimpancé', 'Loro', 'Gato'] },
    { q: '¿Cuál es el músculo más fuerte del cuerpo (por tamaño)?', a: 'Masetero', opciones: ['Glúteo', 'Lengua', 'Masetero', 'Bíceps', 'Corazón', 'Cuádriceps'] },
    { q: '¿Qué gas absorben las plantas y liberan los humanos?', a: 'Dióxido de carbono', opciones: ['Oxígeno', 'Nitrógeno', 'Dióxido de carbono', 'Metano', 'Hidrógeno', 'Argón'] }
],
    'quimica': [
    { q: '¿Cuál es el símbolo químico del Oro?', a: 'Au', opciones: ['Ag', 'Au', 'Fe', 'Or', 'Pb', 'Pt'] },
    { q: '¿Cuál es el elemento más abundante en el universo?', a: 'Hidrógeno', opciones: ['Oxígeno', 'Helio', 'Hidrógeno', 'Carbono', 'Nitrógeno', 'Hierro'] },
    { q: '¿Cuál es la fórmula química del agua?', a: 'H2O', opciones: ['HO2', 'H2O', 'H2O2', 'OH2', 'O2H', 'H3O'] },
    { q: '¿Qué gas expulsamos los humanos al respirar?', a: 'Dióxido de carbono', opciones: ['Oxígeno', 'Nitrógeno', 'Dióxido de carbono', 'Metano', 'Hidrógeno', 'Argón'] },
    { q: '¿Cuál es el pH del agua pura?', a: '7', opciones: ['0', '1', '5', '7', '10', '14'] },
    { q: '¿Quién es considerado el creador de la tabla periódica?', a: 'Dmitri Mendeléyev', opciones: ['Marie Curie', 'Dmitri Mendeléyev', 'Antoine Lavoisier', 'John Dalton', 'Niels Bohr', 'Alfred Nobel'] },
    { q: '¿Qué elemento tiene el símbolo "K"?', a: 'Potasio', opciones: ['Kriptón', 'Potasio', 'Calcio', 'Hierro', 'Fósforo', 'Cobre'] },
    { q: '¿Cuál es el único metal que es líquido a temperatura ambiente?', a: 'Mercurio', opciones: ['Plata', 'Cobre', 'Plomo', 'Mercurio', 'Galio', 'Magnesio'] },
    { q: '¿Qué gas se utiliza para inflar globos que flotan?', a: 'Helio', opciones: ['Oxígeno', 'Nitrógeno', 'Helio', 'Hidrógeno', 'Neón', 'Aire'] },
    { q: '¿Cuál es el componente principal del diamante?', a: 'Carbono', opciones: ['Silicio', 'Carbono', 'Oxígeno', 'Hierro', 'Calcio', 'Nitrógeno'] },
    { q: '¿Cómo se llama la mezcla de cobre y estaño?', a: 'Bronce', opciones: ['Acero', 'Latón', 'Bronce', 'Oro blanco', 'Amalgama', 'Soldadura'] },
    { q: '¿Cuál es el símbolo químico del Hierro?', a: 'Fe', opciones: ['Hi', 'He', 'Ir', 'Fe', 'F', 'H'] },
    { q: '¿Qué tipo de enlace ocurre cuando se comparten electrones?', a: 'Covalente', opciones: ['Iónico', 'Covalente', 'Metálico', 'De hidrógeno', 'De Van der Waals', 'Polar'] },
    { q: '¿Cuál es la fórmula de la sal de mesa común?', a: 'NaCl', opciones: ['KCl', 'NaOH', 'NaCl', 'HCl', 'NaHCO3', 'MgCl2'] },
    { q: '¿Qué elemento es esencial para la combustión?', a: 'Oxígeno', opciones: ['Nitrógeno', 'Helio', 'Oxígeno', 'Carbono', 'Argón', 'Hidrógeno'] },
    { q: '¿Cuál es el gas más abundante en la atmósfera terrestre?', a: 'Nitrógeno', opciones: ['Oxígeno', 'Nitrógeno', 'Dióxido de carbono', 'Argón', 'Neón', 'Helio'] },
    { q: '¿Cómo se llaman las partículas con carga negativa en un átomo?', a: 'Electrones', opciones: ['Protones', 'Neutrones', 'Electrones', 'Positrones', 'Quarks', 'Fotones'] },
    { q: '¿Qué ácido se encuentra en el estómago humano?', a: 'Ácido clorhídrico', opciones: ['Ácido sulfúrico', 'Ácido nítrico', 'Ácido clorhídrico', 'Ácido acético', 'Ácido cítrico', 'Ácido láctico'] },
    { q: '¿Cuál es el símbolo químico de la Plata?', a: 'Ag', opciones: ['Pl', 'Au', 'Ag', 'Pt', 'Si', 'Al'] },
    { q: '¿Qué proceso convierte un líquido en gas?', a: 'Evaporación', opciones: ['Condensación', 'Fusión', 'Evaporación', 'Solidificación', 'Sublimación', 'Filtración'] }
],
    'politica': [
    { q: '¿Dónde está la sede de la ONU?', a: 'Nueva York', opciones: ['Ginebra', 'París', 'Nueva York', 'Washington', 'Londres', 'Bruselas'] },
    { q: '¿Quién es el autor de "El Manifiesto Comunista"?', a: 'Karl Marx', opciones: ['Lenin', 'Karl Marx', 'Stalin', 'Mao Zedong', 'Adam Smith', 'Engels'] },
    { q: '¿Qué país tiene un sistema de monarquía absoluta hoy?', a: 'Arabia Saudita', opciones: ['España', 'Reino Unido', 'Japón', 'Arabia Saudita', 'Marruecos', 'Noruega'] },
    { q: '¿Cómo se llama el sistema de voto indirecto en EE.UU.?', a: 'Colegio Electoral', opciones: ['Voto directo', 'Colegio Electoral', 'Voto censitario', 'Parlamentarismo', 'Bicameralismo', 'Referéndum'] },
    { q: '¿Qué ideología busca el libre mercado y mínima intervención estatal?', a: 'Libertarismo', opciones: ['Socialismo', 'Comunismo', 'Libertarismo', 'Fascismo', 'Anarquismo', 'Conservadurismo'] },
    { q: '¿En qué ciudad se firmó el tratado de la Unión Europea?', a: 'Maastricht', opciones: ['Bruselas', 'París', 'Maastricht', 'Berlín', 'Roma', 'Lisboa'] },
    { q: '¿Quién fue conocida como la "Dama de Hierro"?', a: 'Margaret Thatcher', opciones: ['Angela Merkel', 'Margaret Thatcher', 'Indira Gandhi', 'Theresa May', 'Hillary Clinton', 'Isabel II'] },
    { q: '¿Qué significa la sigla PIB?', a: 'Producto Interno Bruto', opciones: ['Precio Interno Base', 'Producto Interno Bruto', 'País Industrializado Bajo', 'Poder Interno Bruto', 'Producción Individual Base', 'Precio de Inversión Bruta'] },
    { q: '¿Qué país es el miembro más reciente de la OTAN (2024)?', a: 'Suecia', opciones: ['Finlandia', 'Ucrania', 'Suecia', 'Islandia', 'Turquía', 'Polonia'] },
    { q: '¿Quién preside el poder ejecutivo en un sistema parlamentario?', a: 'Primer Ministro', opciones: ['Presidente', 'Rey', 'Primer Ministro', 'Canciller', 'Senador', 'Diputado'] },
    { q: '¿Cuál es el libro base del liberalismo escrito por Adam Smith?', a: 'La riqueza de las naciones', opciones: ['El Capital', 'La riqueza de las naciones', 'Leviatán', 'El Contrato Social', 'El Príncipe', 'Utopía'] },
    { q: '¿Qué organismo internacional tiene su sede en La Haya?', a: 'Corte Internacional de Justicia', opciones: ['FMI', 'OMC', 'Corte Internacional de Justicia', 'OTAN', 'UNESCO', 'OIT'] },
    { q: '¿Quién fue el líder del movimiento de independencia de la India?', a: 'Mahatma Gandhi', opciones: ['Jawaharlal Nehru', 'Mahatma Gandhi', 'Subhas Chandra Bose', 'B.R. Ambedkar', 'Indira Gandhi', 'Sardar Patel'] },
    { q: '¿Qué ideología política enfatiza la autoridad y el nacionalismo extremo?', a: 'Fascismo', opciones: ['Liberalismo', 'Fascismo', 'Socialdemocracia', 'Ecologismo', 'Pacifismo', 'Globalismo'] },
    { q: '¿En qué año cayó el Muro de Berlín?', a: '1989', opciones: ['1985', '1989', '1991', '1990', '1987', '1993'] },
    { q: '¿Qué nombre recibe la cámara alta en muchos sistemas legislativos?', a: 'Senado', opciones: ['Congreso', 'Senado', 'Asamblea', 'Ayuntamiento', 'Cortes', 'Parlamento'] },
    { q: '¿Quién escribió "El Príncipe"?', a: 'Nicolás Maquiavelo', opciones: ['Dante Alighieri', 'Nicolás Maquiavelo', 'Tomas Moro', 'Erasmo de Rotterdam', 'Hobbes', 'Locke'] },
    { q: '¿Qué país abandonó la Unión Europea en el proceso llamado Brexit?', a: 'Reino Unido', opciones: ['Grecia', 'Francia', 'Reino Unido', 'Italia', 'Irlanda', 'Noruega'] },
    { q: '¿Cuál es la ley fundamental de un Estado?', a: 'Constitución', opciones: ['Código Civil', 'Constitución', 'Decreto Ley', 'Tratado Internacional', 'Reglamento', 'Estatuto'] },
    { q: '¿Qué tipo de gobierno ejerce el poder sin límites constitucionales?', a: 'Dictadura', opciones: ['República', 'Monarquía Parlamentaria', 'Dictadura', 'Federación', 'Confederación', 'Democracia'] },
    { q: '¿A qué ideología pertenece el concepto de "plusvalía"?', a: 'Marxismo', opciones: ['Liberalismo', 'Marxismo', 'Keynesianismo', 'Anarcocapitalismo', 'Feudalismo', 'Mercantilismo'] },
    { q: '¿Quién fue el primer presidente negro de Sudáfrica?', a: 'Nelson Mandela', opciones: ['Desmond Tutu', 'Nelson Mandela', 'Thabo Mbeki', 'Robert Mugabe', 'Kofi Annan', 'Jacob Zuma'] },
    { q: '¿Qué organización tiene como objetivo la estabilidad financiera mundial?', a: 'FMI', opciones: ['OMS', 'FMI', 'OEA', 'Greenpeace', 'Amnistía Internacional', 'UNICEF'] },
    { q: '¿Cuál es el principal órgano de toma de decisiones de la ONU?', a: 'Consejo de Seguridad', opciones: ['Asamblea General', 'Consejo de Seguridad', 'Secretaría', 'Consejo Económico', 'Corte Penal', 'Estatus Quo'] },
    { q: '¿En qué país surgió la Revolución Francesa?', a: 'Francia', opciones: ['Bélgica', 'Italia', 'Francia', 'Austria', 'Prusia', 'Suiza'] },
    { q: '¿Qué significa la sigla OEA?', a: 'Organización de los Estados Americanos', opciones: ['Orden de Estados Andinos', 'Organización de los Estados Americanos', 'Oficina de Estudios Agrícolas', 'Operación de Ejércitos Aliados', 'Organismo de Energía Atómica', 'Organización de Exportadores Árabes'] },
    { q: '¿Quién es el actual Secretario General de la ONU (2024)?', a: 'António Guterres', opciones: ['Ban Ki-moon', 'António Guterres', 'Kofi Annan', 'Boutros-Ghali', 'Javier Pérez de Cuéllar', 'Donald Trump'] },
    { q: '¿Qué ideología promueve la abolición de todo gobierno?', a: 'Anarquismo', opciones: ['Totalitarismo', 'Anarquismo', 'Monarquismo', 'Teocracia', 'Oligarquía', 'Plutocracia'] },
    { q: '¿Qué ciudad es considerada la capital política de la Unión Europea?', a: 'Bruselas', opciones: ['Luxemburgo', 'Estrasburgo', 'Bruselas', 'Ámsterdam', 'Madrid', 'Viena'] },
    { q: '¿Qué país es conocido como la democracia más grande del mundo por su población?', a: 'India', opciones: ['EE.UU.', 'China', 'India', 'Brasil', 'Indonesia', 'Nigeria'] }
],
};

const salasTrivia = new Map();
const cooldowns = new Map();

let handler = async (m, { conn, text, usedPrefix, command }) => {
    let user = global.db.data.users[m.sender]
    let id = m.sender

    if (await checkReg(m, user)) return

    // --- COOLDOWN DE 15 SEGUNDOS ---
    let time = cooldowns.get(id) || 0
    if (Date.now() - time < 15000) {
        let wait = Math.ceil((15000 - (Date.now() - time)) / 1000)
        return m.reply(`> ⏳ *DESPACIO:* Tu mente está ardiendo, espera **${wait}s** para la siguiente.`)
    }

    if (salasTrivia.has(id)) return m.reply(`> 🎀 *Aviso:* Ya tienes una trivia activa. ¡Responde con el número!`)

    let category = text?.toLowerCase().trim()
    let validCategories = Object.keys(triviaData)

    if (!category || !validCategories.includes(category)) {
        let help = `📚 *𝗗𝗘𝗦𝗔𝗙𝗜́𝗢 𝗗𝗘 𝗧𝗥𝗜𝗩𝗜𝗔*\n\n`
        help += `> Elige una categoría, mi vida:\n\n`
        validCategories.forEach(cat => help += `• *${cat.toUpperCase()}*\n`)
        help += `\n💡 *Uso:* \`${usedPrefix + command} historia\``
        return m.reply(help)
    }

    let questions = triviaData[category]
    let q = questions[Math.floor(Math.random() * questions.length)]
    let options = [...q.opciones].sort(() => Math.random() - 0.5)
    let correctIndex = options.findIndex(op => op.toLowerCase() === q.a.toLowerCase()) + 1

    salasTrivia.set(id, {
        correct: correctIndex,
        ans: q.a,
        intentos: 1,
        chat: m.chat
    })

    await m.react('🧠')
    let caption = `📝 *𝗧𝗥𝗜𝗩𝗜𝗔: ${category.toUpperCase()}*\n\n`
    caption += `❓ *𝗣𝗥𝗘𝗚𝗨𝗡𝗧𝗔:* \n> ${q.q}\n\n`
    
    options.forEach((op, i) => {
        caption += `*${i + 1}.* ${op}\n`
    })

    caption += `\n> 🔥 *Racha:* ${user.racha || 0}\n`
    caption += `> ⚠️ Tienes **1 oportunidad**.\n`
    caption += `> _Responde solo con el número._`

    return conn.reply(m.chat, caption, m)
}

handler.before = async (m, { conn }) => {
    let id = m.sender
    let game = salasTrivia.get(id)
    if (!game || m.isBaileys || !m.text) return 
    if (m.chat !== game.chat) return 

    if (!/^[1-6]$/.test(m.text.trim())) return 

    let input = parseInt(m.text.trim())
    let user = global.db.data.users[id]

    if (input === game.correct) {
        let ganCoins = Math.floor(Math.random() * (2500 - 1800 + 1)) + 1800 
        let ganExp = Math.floor(Math.random() * 500) + 300
        
        user.coin = (user.coin || 0) + ganCoins
        user.exp = (user.exp || 0) + ganExp
        user.racha = (user.racha || 0) + 1

        let bonus = ""
        if (user.racha % 5 === 0) {
            user.diamond = (user.diamond || 0) + 2
            bonus = `\n🔥 *BONUS RACHA:* +2 💎 Diamantes`
        }

        salasTrivia.delete(id)
        cooldowns.set(id, Date.now())
        await m.react('✅')

        let win = `✨ *¡𝗤𝗨𝗘́ 𝗕𝗥𝗜𝗟𝗟𝗔𝗡𝗧𝗘!*\n\n`
        win += `> ✅ Correcto: *${game.ans}*\n`
        win += `> *Ganaste:* ${ganCoins.toLocaleString()} 🪙 y ${ganExp} ✨\n`
        win += `> *Racha:* ${user.racha} 🔥${bonus}`

        await m.reply(win)
        await saveDatabase()
    } else {
        user.racha = 0
        salasTrivia.delete(id)
        cooldowns.set(id, Date.now())
        await m.react('❌')
        
        return m.reply(`🚫 *¡𝗜𝗡𝗖𝗢𝗥𝗥𝗘𝗖𝗧𝗢!*\n\n> La respuesta era: *${game.ans}*\n> Tu racha 🔥 se ha roto. Me has decepcionado un poquito... 💋`)
    }
    return true
}

handler.help = ['trivia']
handler.tags = ['game']
handler.command = /^(trivia|ptrivia)$/i

export default handler
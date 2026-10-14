export interface PreguntaTrivia {
  pregunta: string;
  opciones: {
    letra: string;
    texto: string;
  }[];
  respuestaCorrecta: string;
  explicacion: string;
}
export const BANCO_PREGUNTAS: Record<1 | 2 | 3, PreguntaTrivia[]> = {
  1: [
        {
          pregunta: '¿De qué país es originaria la famosa pizza?',
          opciones: [
            { letra: 'A', texto: 'México' },
            { letra: 'B', texto: 'Italia' },
            { letra: 'C', texto: 'Japón' },
            { letra: 'D', texto: 'Francia' }
          ],
          respuestaCorrecta: 'B',
          explicacion: 'La pizza nació en la ciudad de Nápoles, Italia, y se convirtió en uno de los platos más populares del mundo.'
        },
        {
          pregunta: '¿Qué tipo de animal es el famoso Mickey Mouse?',
          opciones: [
            { letra: 'A', texto: 'Un perro' },
            { letra: 'B', texto: 'Un gato' },
            { letra: 'C', texto: 'Un ratón' },
            { letra: 'D', texto: 'Un conejo' }
          ],
          respuestaCorrecta: 'C',
          explicacion: 'Mickey Mouse es el ratón animado más famoso de la historia, creado por Walt Disney en 1928.'
        },
        {
          pregunta: '¿Cómo se le llama al sonido característico que hacen los gatos?',
          opciones: [
            { letra: 'A', texto: 'Ladrido' },
            { letra: 'B', texto: 'Maullido' },
            { letra: 'C', texto: 'Relincho' },
            { letra: 'D', texto: 'Rugido' }
          ],
          respuestaCorrecta: 'B',
          explicacion: 'El maullido es el sonido que usan los gatos domésticos principalmente para comunicarse con los humanos.'
        },
        {
          pregunta: '¿Dónde vive el alegre personaje animado Bob Esponja?',
          opciones: [
            { letra: 'A', texto: 'En un castillo de arena' },
            { letra: 'B', texto: 'En una torre de cristal' },
            { letra: 'C', texto: 'En una piña bajo el mar' },
            { letra: 'D', texto: 'En un barco pirata' }
          ],
          respuestaCorrecta: 'C',
          explicacion: 'Como dice su famosa canción de inicio, Bob Esponja vive en una piña debajo del mar en Fondo de Bikini.'
        },
        {
          pregunta: '¿Qué fruta se necesita principalmente para preparar una clásica limonada?',
          opciones: [
            { letra: 'A', texto: 'Naranja' },
            { letra: 'B', texto: 'Manzana' },
            { letra: 'C', texto: 'Banana' },
            { letra: 'D', texto: 'Limón' }
          ],
          respuestaCorrecta: 'D',
          explicacion: 'El limón es el ingrediente estrella y el que le da el toque ácido y refrescante a la limonada.'
        },
        {
          pregunta: '¿Cuál de estos animales es famoso por tener una trompa muy larga y orejas grandes?',
          opciones: [
            { letra: 'A', texto: 'El león' },
            { letra: 'B', texto: 'El elefante' },
            { letra: 'C', texto: 'El cocodrilo' },
            { letra: 'D', texto: 'El pingüino' }
          ],
          respuestaCorrecta: 'B',
          explicacion: 'Los elefantes usan su larga trompa para oler, respirar, emitir sonidos y agarrar comida o agua.'
        },
        {
          pregunta: '¿A qué se dedica Super Mario, el famoso personaje de los videojuegos?',
          opciones: [
            { letra: 'A', texto: 'Plomero / Fontanero' },
            { letra: 'B', texto: 'Bombero' },
            { letra: 'C', texto: 'Astronauta' },
            { letra: 'D', texto: 'Jardinero' }
          ],
          respuestaCorrecta: 'A',
          explicacion: 'Mario es el plomero más famoso del mundo, conocido por viajar a través de tuberías para rescatar a la Princesa Peach.'
        },
        {
          pregunta: '¿Qué superhéroe trepa por las paredes y lanza telarañas?',
          opciones: [
            { letra: 'A', texto: 'Batman' },
            { letra: 'B', texto: 'Superman' },
            { letra: 'C', texto: 'Iron Man' },
            { letra: 'D', texto: 'Spider-Man' }
          ],
          respuestaCorrecta: 'D',
          explicacion: 'Spider-Man (el Hombre Araña) obtuvo sus poderes tras ser mordido por una araña radiactiva.'
        }
      ],

    2: [
        {
          pregunta: '¿Cuál de estos alimentos NO es una fruta?',
          opciones: [
            { letra: 'A', texto: 'Manzana' },
            { letra: 'B', texto: 'Lechuga' },
            { letra: 'C', texto: 'Banana' },
            { letra: 'D', texto: 'Frutilla' }
          ],
          respuestaCorrecta: 'B',
          explicacion: 'La lechuga es una verdura de hoja verde, mientras que las otras opciones son deliciosas frutas.'
        },
        {
          pregunta: '¿Cuál es el color de las famosas golosinas conocidas como "Ositos de Oro" de Haribo?',
          opciones: [
            { letra: 'A', texto: 'Vienen de muchos colores' },
            { letra: 'B', texto: 'Solo son negros' },
            { letra: 'C', texto: 'Solo son blancos' },
            { letra: 'D', texto: 'Solo son azules' }
          ],
          respuestaCorrecta: 'A',
          explicacion: 'Las gomitas de ositos vienen en una mezcla divertida de colores y sabores frutales como frutilla, limón y naranja.'
        },
        {
          pregunta: '¿Qué ingrediente frío y dulce se derrite si lo dejas al sol?',
          opciones: [
            { letra: 'A', texto: 'Un helado' },
            { letra: 'B', texto: 'Una galletita' },
            { letra: 'C', texto: 'Un alfajor' },
            { letra: 'D', texto: 'Un pedazo de pan' }
          ],
          respuestaCorrecta: 'A',
          explicacion: 'El helado está hecho a base de crema o agua congelada, por lo que necesita mantenerse frío para no derretirse.'
        },
        {
          pregunta: '¿Qué animal es famoso por ser el rey de la selva y tener una gran melena?',
          opciones: [
            { letra: 'A', texto: 'El oso' },
            { letra: 'B', texto: 'El león' },
            { letra: 'C', texto: 'El mono' },
            { letra: 'D', texto: 'La jirafa' }
          ],
          respuestaCorrecta: 'B',
          explicacion: 'El león es conocido tradicionalmente como el rey de la selva gracias a su imponente rugido y su gran melena.'
        },
        {
          pregunta: '¿Cuántos días tiene normalmente una semana?',
          opciones: [
            { letra: 'A', texto: '5 días' },
            { letra: 'B', texto: '10 días' },
            { letra: 'C', texto: '7 días' },
            { letra: 'D', texto: '12 días' }
          ],
          respuestaCorrecta: 'C',
          explicacion: 'Una semana completa tiene 7 días, comenzando el lunes y terminando el domingo.'
        },
        {
          pregunta: '¿Qué personaje de Disney pierde uno de sus zapatos de cristal en el baile real?',
          opciones: [
            { letra: 'A', texto: 'Cenicienta' },
            { letra: 'B', texto: 'Blancanieves' },
            { letra: 'C', texto: 'Rapunzel' },
            { letra: 'D', texto: 'La Sirenita' }
          ],
          respuestaCorrecta: 'A',
          explicacion: 'Cenicienta pierde su zapato de cristal al salir corriendo del castillo justo antes de la medianoche.'
        },
        {
          pregunta: '¿Qué bebida caliente se prepara tradicionalmente usando hojas metidas en una taza con agua hirviendo?',
          opciones: [
            { letra: 'A', texto: 'Gaseosa' },
            { letra: 'B', texto: 'Té' },
            { letra: 'C', texto: 'Jugo de naranja' },
            { letra: 'D', texto: 'Leche fría' }
          ],
          respuestaCorrecta: 'B',
          explicacion: 'El té se elabora mediante la infusión de hojas de la planta de té en agua muy caliente.'
        },
        {
          pregunta: '¿Qué objeto redondo usan los jugadores de fútbol para hacer un gol?',
          opciones: [
            { letra: 'A', texto: 'Un bate' },
            { letra: 'B', texto: 'Una raqueta' },
            { letra: 'C', texto: 'Una pelota' },
            { letra: 'D', texto: 'Un patín' }
          ],
          respuestaCorrecta: 'C',
          explicacion: 'En el fútbol el objetivo principal es patear la pelota para meterla dentro del arco contrario.'
        }
      ],

    3: [
        {
          pregunta: '¿Cuál de estos ingredientes es el principal para hacer una tortilla tradicional argentina?',
          opciones: [
            { letra: 'A', texto: 'Arroz' },
            { letra: 'B', texto: 'Papa' },
            { letra: 'C', texto: 'Fideos' },
            { letra: 'D', texto: 'Calabaza' }
          ],
          respuestaCorrecta: 'B',
          explicacion: 'La tortilla clásica de los bodegones y restaurantes se hace a base de papas y huevos (¡y a veces con cebolla!).'
        },
        {
          pregunta: '¿Cuál es el océano más grande del planeta Tierra?',
          opciones: [
            { letra: 'A', texto: 'Océano Atlántico' },
            { letra: 'B', texto: 'Océano Índico' },
            { letra: 'C', texto: 'Océano Pacífico' },
            { letra: 'D', texto: 'Océano Ártico' }
          ],
          respuestaCorrecta: 'C',
          explicacion: 'El Océano Pacífico es el más grande del mundo y cubre más de la tercera parte de la superficie de la Tierra.'
        },
        {
          pregunta: '¿Cómo se llama el villano de color morado que busca las Gemas del Infinito en las películas de Marvel?',
          opciones: [
            { letra: 'A', texto: 'Thanos' },
            { letra: 'B', texto: 'Loki' },
            { letra: 'C', texto: 'Ultron' },
            { letra: 'D', texto: 'Duende Verde' }
          ],
          respuestaCorrecta: 'A',
          explicacion: 'Thanos es el famoso titán que busca recolectar todas las gemas en su guantelete para las películas de Avengers.'
        },
        {
          pregunta: '¿Qué fruta se usa tradicionalmente para hacer el vino?',
          opciones: [
            { letra: 'A', texto: 'Manzana' },
            { letra: 'B', texto: 'Uva' },
            { letra: 'C', texto: 'Pera' },
            { letra: 'D', texto: 'Durazno' }
          ],
          respuestaCorrecta: 'B',
          explicacion: 'El vino se obtiene a través de la fermentación del jugo de las uvas.'
        },
        {
          pregunta: '¿En qué continente se encuentra la famosa Torre Eiffel?',
          opciones: [
            { letra: 'A', texto: 'América' },
            { letra: 'B', texto: 'Asia' },
            { letra: 'C', texto: 'Europa' },
            { letra: 'D', texto: 'África' }
          ],
          respuestaCorrecta: 'C',
          explicacion: 'La Torre Eiffel está ubicada en París, Francia, que es un país del continente europeo.'
        },
        {
          pregunta: '¿Cuántos meses tienen 28 días en un año común?',
          opciones: [
            { letra: 'A', texto: 'Solo 1 (Febrero)' },
            { letra: 'B', texto: 'Ninguno' },
            { letra: 'C', texto: 'Todos los 12 meses' },
            { letra: 'D', texto: '6 meses' }
          ],
          respuestaCorrecta: 'C',
          explicacion: '¡Es una pregunta con trampa! Todos los meses del año tienen al menos 28 días.'
        },
        {
          pregunta: '¿Qué famosa banda británica de rock era liderada por el cantante Freddie Mercury?',
          opciones: [
            { letra: 'A', texto: 'Queen' },
            { letra: 'B', texto: 'The Beatles' },
            { letra: 'C', texto: 'Pink Floyd' },
            { letra: 'D', texto: 'Coldplay' }
          ],
          respuestaCorrecta: 'A',
          explicacion: 'Freddie Mercury fue el legendario vocalista y pianista de la banda de rock Queen.'
        },
        {
          pregunta: '¿Cuál es el país más grande del mundo por su territorio?',
          opciones: [
            { letra: 'A', texto: 'Rusia' },
            { letra: 'B', texto: 'China' },
            { letra: 'C', texto: 'Estados Unidos' },
            { letra: 'D', texto: 'Brasil' }
          ],
          respuestaCorrecta: 'A',
          explicacion: 'Rusia es el país con mayor extensión territorial del planeta, abarcando parte de Europa y de Asia.'
        },
        {
          pregunta: '¿Qué tipo de animal es el icónico personaje de la televisión "Winnie the Pooh"?',
          opciones: [
            { letra: 'A', texto: 'Un oso' },
            { letra: 'B', texto: 'Un tigre' },
            { letra: 'C', texto: 'Un conejo' },
            { letra: 'D', texto: 'Un cerdito' }
          ],
          respuestaCorrecta: 'A',
          explicacion: 'Winnie the Pooh es un simpático oso de peluche que tiene una gran debilidad por la miel.'
        },
        {
          pregunta: '¿Qué gas necesitamos respirar los seres humanos para poder vivir?',
          opciones: [
            { letra: 'A', texto: 'Dióxido de carbono' },
            { letra: 'B', texto: 'Oxígeno' },
            { letra: 'C', texto: 'Nitrógeno' },
            { letra: 'D', texto: 'Helio' }
          ],
          respuestaCorrecta: 'B',
          explicacion: 'El oxígeno es el gas fundamental que absorben nuestros pulmones para mantenernos con vida.'
        },
        {
          pregunta: '¿Cuál es la capital de Italia, famosa por su Coliseo y sus fuentes?',
          opciones: [
            { letra: 'A', texto: 'Milán' },
            { letra: 'B', texto: 'Venecia' },
            { letra: 'C', texto: 'Roma' },
            { letra: 'D', texto: 'Florencia' }
          ],
          respuestaCorrecta: 'C',
          explicacion: 'Roma es la capital histórica de Italia y alberga monumentos antiguos increíbles como el Coliseo Romano.'
        },
        {
          pregunta: '¿A qué color le corresponde la tarjeta que usa un árbitro de fútbol para expulsar definitivamente a un jugador?',
          opciones: [
            { letra: 'A', texto: 'Amarilla' },
            { letra: 'B', texto: 'Verde' },
            { letra: 'C', texto: 'Azul' },
            { letra: 'D', texto: 'Roja' }
          ],
          respuestaCorrecta: 'D',
          explicacion: 'La tarjeta roja significa la expulsión inmediata y directa del jugador del campo de juego.'
        }
      ]

  };

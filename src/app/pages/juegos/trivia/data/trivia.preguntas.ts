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
        pregunta:
          '¿Cuál es la capital de Australia?',
        opciones: [
          {
            letra: 'A',
            texto: 'Sídney'
          },
          {
            letra: 'B',
            texto: 'Melbourne'
          },
          {
            letra: 'C',
            texto: 'Canberra'
          },
          {
            letra: 'D',
            texto: 'Brisbane'
          }
        ],
        respuestaCorrecta: 'C',
        explicacion:
          'Canberra es la capital de Australia. Sídney y Melbourne son ciudades más grandes y conocidas.'
      },
      {
        pregunta:
          '¿Quién dirigió la película Titanic estrenada en 1997?',
        opciones: [
          {
            letra: 'A',
            texto: 'Steven Spielberg'
          },
          {
            letra: 'B',
            texto: 'James Cameron'
          },
          {
            letra: 'C',
            texto: 'Christopher Nolan'
          },
          {
            letra: 'D',
            texto: 'George Lucas'
          }
        ],
        respuestaCorrecta: 'B',
        explicacion:
          'James Cameron dirigió Titanic, protagonizada por Leonardo DiCaprio y Kate Winslet.'
      },
      {
        pregunta:
          '¿Qué instrumento musical tiene normalmente 88 teclas?',
        opciones: [
          {
            letra: 'A',
            texto: 'Violín'
          },
          {
            letra: 'B',
            texto: 'Piano'
          },
          {
            letra: 'C',
            texto: 'Saxofón'
          },
          {
            letra: 'D',
            texto: 'Acordeón'
          }
        ],
        respuestaCorrecta: 'B',
        explicacion:
          'El piano estándar moderno tiene 88 teclas.'
      },
      {
        pregunta:
          '¿En qué país se encuentra la ciudad de Kioto?',
        opciones: [
          {
            letra: 'A',
            texto: 'China'
          },
          {
            letra: 'B',
            texto: 'Corea del Sur'
          },
          {
            letra: 'C',
            texto: 'Japón'
          },
          {
            letra: 'D',
            texto: 'Tailandia'
          }
        ],
        respuestaCorrecta: 'C',
        explicacion:
          'Kioto es una ciudad japonesa conocida por sus templos y su importancia histórica.'
      },
      {
        pregunta:
          '¿Cuál de estos animales es un mamífero?',
        opciones: [
          {
            letra: 'A',
            texto: 'Delfín'
          },
          {
            letra: 'B',
            texto: 'Tiburón'
          },
          {
            letra: 'C',
            texto: 'Pingüino'
          },
          {
            letra: 'D',
            texto: 'Cocodrilo'
          }
        ],
        respuestaCorrecta: 'A',
        explicacion:
          'El delfín es un mamífero marino, aunque viva en el agua.'
      },
      {
        pregunta:
          '¿Qué escritor argentino creó al personaje de ficción conocido como el detective Isidro Parodi?',
        opciones: [
          {
            letra: 'A',
            texto: 'Jorge Luis Borges'
          },
          {
            letra: 'B',
            texto: 'Ernesto Sabato'
          },
          {
            letra: 'C',
            texto: 'Julio Cortázar'
          },
          {
            letra: 'D',
            texto: 'Adolfo Bioy Casares'
          }
        ],
        respuestaCorrecta: 'A',
        explicacion:
          'Isidro Parodi fue creado por Jorge Luis Borges y Adolfo Bioy Casares bajo el seudónimo H. Bustos Domecq.'
      },
      {
        pregunta:
          '¿Qué planeta es conocido como el planeta rojo?',
        opciones: [
          {
            letra: 'A',
            texto: 'Venus'
          },
          {
            letra: 'B',
            texto: 'Marte'
          },
          {
            letra: 'C',
            texto: 'Mercurio'
          },
          {
            letra: 'D',
            texto: 'Saturno'
          }
        ],
        respuestaCorrecta: 'B',
        explicacion:
          'Marte recibe el nombre de planeta rojo por el aspecto rojizo de su superficie.'
      },
      {
        pregunta:
          '¿En qué deporte se utiliza una pelota ovalada?',
        opciones: [
          {
            letra: 'A',
            texto: 'Básquet'
          },
          {
            letra: 'B',
            texto: 'Vóley'
          },
          {
            letra: 'C',
            texto: 'Rugby'
          },
          {
            letra: 'D',
            texto: 'Béisbol'
          }
        ],
        respuestaCorrecta: 'C',
        explicacion:
          'El rugby utiliza una pelota ovalada, característica de este deporte.'
      }
    ],
    2: [
      {
        pregunta:
          '¿Cuál de estos países NO pertenece a América del Sur?',
        opciones: [
          {
            letra: 'A',
            texto: 'Ecuador'
          },
          {
            letra: 'B',
            texto: 'Surinam'
          },
          {
            letra: 'C',
            texto: 'Panamá'
          },
          {
            letra: 'D',
            texto: 'Paraguay'
          }
        ],
        respuestaCorrecta: 'C',
        explicacion:
          'Panamá se encuentra en América Central. Ecuador, Surinam y Paraguay pertenecen a América del Sur.'
      },
      {
        pregunta:
          '¿Qué acontecimiento ocurrió primero?',
        opciones: [
          {
            letra: 'A',
            texto: 'Llegada del hombre a la Luna'
          },
          {
            letra: 'B',
            texto: 'Caída del Muro de Berlín'
          },
          {
            letra: 'C',
            texto: 'Descubrimiento de América por Colón'
          },
          {
            letra: 'D',
            texto: 'Revolución Francesa'
          }
        ],
        respuestaCorrecta: 'C',
        explicacion:
          'El viaje de Cristóbal Colón que llegó a América ocurrió en 1492, antes que los otros acontecimientos.'
      },
      {
        pregunta:
          '¿Cuál de estas películas ganó el Óscar a Mejor Película?',
        opciones: [
          {
            letra: 'A',
            texto: 'Avatar'
          },
          {
            letra: 'B',
            texto: 'Gladiador'
          },
          {
            letra: 'C',
            texto: 'Piratas del Caribe'
          },
          {
            letra: 'D',
            texto: 'Harry Potter y la piedra filosofal'
          }
        ],
        respuestaCorrecta: 'B',
        explicacion:
          'Gladiador ganó el Óscar a Mejor Película en la ceremonia de 2001.'
      },
      {
        pregunta:
          '¿Qué país es conocido por haber construido la antigua ciudad de Petra?',
        opciones: [
          {
            letra: 'A',
            texto: 'Jordania'
          },
          {
            letra: 'B',
            texto: 'Egipto'
          },
          {
            letra: 'C',
            texto: 'Grecia'
          },
          {
            letra: 'D',
            texto: 'India'
          }
        ],
        respuestaCorrecta: 'A',
        explicacion:
          'Petra se encuentra en la actual Jordania y fue desarrollada por los nabateos.'
      },
      {
        pregunta:
          '¿Qué grupo musical publicó el álbum "Abbey Road"?',
        opciones: [
          {
            letra: 'A',
            texto: 'Queen'
          },
          {
            letra: 'B',
            texto: 'The Beatles'
          },
          {
            letra: 'C',
            texto: 'The Rolling Stones'
          },
          {
            letra: 'D',
            texto: 'Pink Floyd'
          }
        ],
        respuestaCorrecta: 'B',
        explicacion:
          'Abbey Road fue el undécimo álbum de estudio de The Beatles y se publicó en 1969.'
      },
      {
        pregunta:
          '¿Cuál es el río más largo de Sudamérica?',
        opciones: [
          {
            letra: 'A',
            texto: 'Río Paraná'
          },
          {
            letra: 'B',
            texto: 'Río Orinoco'
          },
          {
            letra: 'C',
            texto: 'Río Amazonas'
          },
          {
            letra: 'D',
            texto: 'Río Uruguay'
          }
        ],
        respuestaCorrecta: 'C',
        explicacion:
          'El Amazonas es el principal río de Sudamérica y uno de los ríos más largos y caudalosos del mundo.'
      },
      {
        pregunta:
          '¿Qué empresa desarrolló originalmente el sistema operativo Android?',
        opciones: [
          {
            letra: 'A',
            texto: 'Microsoft'
          },
          {
            letra: 'B',
            texto: 'Apple'
          },
          {
            letra: 'C',
            texto: 'Google'
          },
          {
            letra: 'D',
            texto: 'Samsung'
          }
        ],
        respuestaCorrecta: 'C',
        explicacion:
          'Google adquirió Android Inc. en 2005 y posteriormente desarrolló el sistema operativo Android.'
      },
      {
        pregunta:
          '¿Cuál de estas obras pertenece a William Shakespeare?',
        opciones: [
          {
            letra: 'A',
            texto: 'Hamlet'
          },
          {
            letra: 'B',
            texto: 'Don Quijote de la Mancha'
          },
          {
            letra: 'C',
            texto: 'La Divina Comedia'
          },
          {
            letra: 'D',
            texto: 'Los miserables'
          }
        ],
        respuestaCorrecta: 'A',
        explicacion:
          'Hamlet es una de las tragedias más conocidas de William Shakespeare.'
      }
    ],
    3: [
      {
        pregunta:
          '¿Cuál de estos países tiene más de una capital oficial o administrativa?',
        opciones: [
          {
            letra: 'A',
            texto: 'Sudáfrica'
          },
          {
            letra: 'B',
            texto: 'España'
          },
          {
            letra: 'C',
            texto: 'Argentina'
          },
          {
            letra: 'D',
            texto: 'México'
          }
        ],
        respuestaCorrecta: 'A',
        explicacion:
          'Sudáfrica tiene tres capitales con distintas funciones: Pretoria, Ciudad del Cabo y Bloemfontein.'
      },
      {
        pregunta:
          '¿Qué pintor es conocido por haber realizado "La noche estrellada"?',
        opciones: [
          {
            letra: 'A',
            texto: 'Claude Monet'
          },
          {
            letra: 'B',
            texto: 'Vincent van Gogh'
          },
          {
            letra: 'C',
            texto: 'Pablo Picasso'
          },
          {
            letra: 'D',
            texto: 'Salvador Dalí'
          }
        ],
        respuestaCorrecta: 'B',
        explicacion:
          'La noche estrellada fue pintada por Vincent van Gogh en 1889.'
      },
      {
        pregunta:
          '¿Cuál de estos países fue sede de los Juegos Olímpicos de 2016?',
        opciones: [
          {
            letra: 'A',
            texto: 'Brasil'
          },
          {
            letra: 'B',
            texto: 'China'
          },
          {
            letra: 'C',
            texto: 'Reino Unido'
          },
          {
            letra: 'D',
            texto: 'Grecia'
          }
        ],
        respuestaCorrecta: 'A',
        explicacion:
          'Los Juegos Olímpicos de 2016 se realizaron en Río de Janeiro, Brasil.'
      },
      {
        pregunta:
          '¿Qué invento se asocia principalmente con Johannes Gutenberg?',
        opciones: [
          {
            letra: 'A',
            texto: 'El telescopio'
          },
          {
            letra: 'B',
            texto: 'La imprenta de tipos móviles'
          },
          {
            letra: 'C',
            texto: 'La máquina de vapor'
          },
          {
            letra: 'D',
            texto: 'El teléfono'
          }
        ],
        respuestaCorrecta: 'B',
        explicacion:
          'Gutenberg desarrolló en Europa una imprenta basada en tipos móviles que revolucionó la producción de libros.'
      },
      {
        pregunta:
          '¿Cuál de estas ciudades NO fue sede de una edición de los Juegos Olímpicos de verano?',
        opciones: [
          {
            letra: 'A',
            texto: 'Barcelona'
          },
          {
            letra: 'B',
            texto: 'Atenas'
          },
          {
            letra: 'C',
            texto: 'Río de Janeiro'
          },
          {
            letra: 'D',
            texto: 'Buenos Aires'
          }
        ],
        respuestaCorrecta: 'D',
        explicacion:
          'Buenos Aires fue sede de los Juegos Olímpicos de la Juventud en 2018, pero no de los Juegos Olímpicos de verano para adultos.'
      },
      {
        pregunta:
          '¿Qué país fue conocido históricamente como Persia?',
        opciones: [
          {
            letra: 'A',
            texto: 'Irak'
          },
          {
            letra: 'B',
            texto: 'Irán'
          },
          {
            letra: 'C',
            texto: 'Siria'
          },
          {
            letra: 'D',
            texto: 'Afganistán'
          }
        ],
        respuestaCorrecta: 'B',
        explicacion:
          'Persia fue el nombre histórico utilizado durante siglos para referirse a gran parte del territorio del actual Irán.'
      },
      {
        pregunta:
          '¿Cuál de estas bandas fue liderada por Freddie Mercury?',
        opciones: [
          {
            letra: 'A',
            texto: 'Queen'
          },
          {
            letra: 'B',
            texto: 'U2'
          },
          {
            letra: 'C',
            texto: 'Nirvana'
          },
          {
            letra: 'D',
            texto: 'Oasis'
          }
        ],
        respuestaCorrecta: 'A',
        explicacion:
          'Freddie Mercury fue el cantante principal y una de las figuras centrales de Queen.'
      },
      {
        pregunta:
          '¿Qué país ganó la Copa Mundial de Fútbol de 2010?',
        opciones: [
          {
            letra: 'A',
            texto: 'Alemania'
          },
          {
            letra: 'B',
            texto: 'Brasil'
          },
          {
            letra: 'C',
            texto: 'España'
          },
          {
            letra: 'D',
            texto: 'Argentina'
          }
        ],
        respuestaCorrecta: 'C',
        explicacion:
          'España ganó el Mundial de 2010 disputado en Sudáfrica, derrotando a Países Bajos en la final.'
      },
      {
        pregunta:
          '¿Cuál de estas novelas fue escrita por George Orwell?',
        opciones: [
          {
            letra: 'A',
            texto: '1984'
          },
          {
            letra: 'B',
            texto: 'Fahrenheit 451'
          },
          {
            letra: 'C',
            texto: 'El nombre de la rosa'
          },
          {
            letra: 'D',
            texto: 'Crónica de una muerte anunciada'
          }
        ],
        respuestaCorrecta: 'A',
        explicacion:
          '1984 fue publicada por George Orwell en 1949 y es una de las novelas distópicas más conocidas.'
      },
      {
        pregunta:
          '¿Qué país tiene como capital a Budapest?',
        opciones: [
          {
            letra: 'A',
            texto: 'Rumania'
          },
          {
            letra: 'B',
            texto: 'Hungría'
          },
          {
            letra: 'C',
            texto: 'Bulgaria'
          },
          {
            letra: 'D',
            texto: 'Croacia'
          }
        ],
        respuestaCorrecta: 'B',
        explicacion:
          'Budapest es la capital de Hungría.'
      },
      {
        pregunta:
          '¿Cuál de estas películas fue dirigida por Christopher Nolan?',
        opciones: [
          {
            letra: 'A',
            texto: 'Interestelar'
          },
          {
            letra: 'B',
            texto: 'Avatar'
          },
          {
            letra: 'C',
            texto: 'Gladiador'
          },
          {
            letra: 'D',
            texto: 'El señor de los anillos'
          }
        ],
        respuestaCorrecta: 'A',
        explicacion:
          'Interestelar fue dirigida por Christopher Nolan y estrenada en 2014.'
      },
      {
        pregunta:
          '¿Qué civilización construyó la ciudad de Chichén Itzá?',
        opciones: [
          {
            letra: 'A',
            texto: 'Los incas'
          },
          {
            letra: 'B',
            texto: 'Los mayas'
          },
          {
            letra: 'C',
            texto: 'Los romanos'
          },
          {
            letra: 'D',
            texto: 'Los persas'
          }
        ],
        respuestaCorrecta: 'B',
        explicacion:
          'Chichén Itzá fue una importante ciudad de la civilización maya en la península de Yucatán.'
      },
      {
        pregunta:
          '¿Cuál de estos países NO utiliza el euro como moneda oficial?',
        opciones: [
          {
            letra: 'A',
            texto: 'Portugal'
          },
          {
            letra: 'B',
            texto: 'Italia'
          },
          {
            letra: 'C',
            texto: 'Suecia'
          },
          {
            letra: 'D',
            texto: 'España'
          }
        ],
        respuestaCorrecta: 'C',
        explicacion:
          'Suecia pertenece a la Unión Europea, pero mantiene la corona sueca como moneda.'
      },
      {
        pregunta:
          '¿Quién escribió "El principito"?',
        opciones: [
          {
            letra: 'A',
            texto: 'Julio Verne'
          },
          {
            letra: 'B',
            texto: 'Antoine de Saint-Exupéry'
          },
          {
            letra: 'C',
            texto: 'Victor Hugo'
          },
          {
            letra: 'D',
            texto: 'Albert Camus'
          }
        ],
        respuestaCorrecta: 'B',
        explicacion:
          'El principito fue escrito y publicado por el escritor y aviador francés Antoine de Saint-Exupéry.'
      },
      {
        pregunta:
          '¿Qué selección ganó la Copa Mundial de Fútbol de 1998?',
        opciones: [
          {
            letra: 'A',
            texto: 'Brasil'
          },
          {
            letra: 'B',
            texto: 'Italia'
          },
          {
            letra: 'C',
            texto: 'Francia'
          },
          {
            letra: 'D',
            texto: 'Alemania'
          }
        ],
        respuestaCorrecta: 'C',
        explicacion:
          'Francia ganó el Mundial de 1998 como local, derrotando a Brasil en la final.'
      },
      {
        pregunta:
          '¿Cuál de estas ciudades es conocida como "La Gran Manzana"?',
        opciones: [
          {
            letra: 'A',
            texto: 'Los Ángeles'
          },
          {
            letra: 'B',
            texto: 'Chicago'
          },
          {
            letra: 'C',
            texto: 'Nueva York'
          },
          {
            letra: 'D',
            texto: 'Boston'
          }
        ],
        respuestaCorrecta: 'C',
        explicacion:
          'La Gran Manzana es uno de los apodos más conocidos de Nueva York.'
      },
      {
        pregunta:
          '¿Qué empresa creó originalmente el sistema operativo Windows?',
        opciones: [
          {
            letra: 'A',
            texto: 'IBM'
          },
          {
            letra: 'B',
            texto: 'Apple'
          },
          {
            letra: 'C',
            texto: 'Microsoft'
          },
          {
            letra: 'D',
            texto: 'Intel'
          }
        ],
        respuestaCorrecta: 'C',
        explicacion:
          'Windows es una familia de sistemas operativos desarrollada por Microsoft.'
      },
      {
        pregunta:
          '¿Cuál de estas obras pertenece a Miguel de Cervantes?',
        opciones: [
          {
            letra: 'A',
            texto: 'La Odisea'
          },
          {
            letra: 'B',
            texto: 'Don Quijote de la Mancha'
          },
          {
            letra: 'C',
            texto: 'La Divina Comedia'
          },
          {
            letra: 'D',
            texto: 'Hamlet'
          }
        ],
        respuestaCorrecta: 'B',
        explicacion:
          'Don Quijote de la Mancha fue escrito por Miguel de Cervantes y publicado en dos partes.'
      },
      {
        pregunta:
          '¿Cuál de estos países tiene como capital a Wellington?',
        opciones: [
          {
            letra: 'A',
            texto: 'Australia'
          },
          {
            letra: 'B',
            texto: 'Nueva Zelanda'
          },
          {
            letra: 'C',
            texto: 'Canadá'
          },
          {
            letra: 'D',
            texto: 'Irlanda'
          }
        ],
        respuestaCorrecta: 'B',
        explicacion:
          'Wellington es la capital de Nueva Zelanda.'
      },
      {
        pregunta:
          '¿Qué videojuego popularizó mundialmente al personaje Mario?',
        opciones: [
          {
            letra: 'A',
            texto: 'The Legend of Zelda'
          },
          {
            letra: 'B',
            texto: 'Super Mario Bros.'
          },
          {
            letra: 'C',
            texto: 'Donkey Kong Country'
          },
          {
            letra: 'D',
            texto: 'Sonic the Hedgehog'
          }
        ],
        respuestaCorrecta: 'B',
        explicacion:
          'Super Mario Bros., lanzado en 1985 para Nintendo Entertainment System, convirtió a Mario en uno de los personajes más reconocidos de los videojuegos.'
      }
    ]
  };

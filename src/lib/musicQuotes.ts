/** Famous lines about music — top bar (initial load + refresh when station changes) and quote generator page. */

export interface MusicQuote {
  text: string;
  author: string;
}

let stableTopBarQuoteIndex: number | null = null;

/** Exactly 100 entries; each `text` is unique. */
export const MUSIC_QUOTES: readonly MusicQuote[] = [
  { text: "Music expresses that which cannot be said and on which it is impossible to be silent.", author: "Victor Hugo" },
  { text: "Where words fail, music speaks.", author: "Hans Christian Andersen" },
  { text: "Music is the shorthand of emotion.", author: "Leo Tolstoy" },
  { text: "Without music, life would be a mistake.", author: "Friedrich Nietzsche" },
  { text: "To play a wrong note is insignificant; to play without passion is inexcusable.", author: "Ludwig van Beethoven" },
  { text: "Music can change the world because it can change people.", author: "Bono" },
  { text: "After silence, that which comes nearest to expressing the inexpressible is music.", author: "Aldous Huxley" },
  { text: "Music is a higher revelation than all wisdom and philosophy.", author: "Ludwig van Beethoven" },
  { text: "The only truth is music.", author: "Jack Kerouac" },
  { text: "Music is the divine way to tell beautiful, poetic things to the heart.", author: "Pablo Casals" },
  { text: "Music is the literature of the heart; it commences where speech ends.", author: "Alphonse de Lamartine" },
  { text: "Where there is music, there can be no evil.", author: "Miguel de Cervantes" },
  { text: "Music produces a kind of pleasure which human nature cannot do without.", author: "Confucius" },
  { text: "Music is the movement of sound to reach the soul for the education of its virtue.", author: "Plato" },
  { text: "If music be the food of love, play on.", author: "William Shakespeare" },
  { text: "Music is the universal language of mankind.", author: "Henry Wadsworth Longfellow" },
  { text: "Music washes away from the soul the dust of everyday life.", author: "Berthold Auerbach" },
  { text: "Music is moonlight in the gloomy night of life.", author: "Jean Paul Richter" },
  { text: "Music is well said to be the speech of angels.", author: "Thomas Carlyle" },
  { text: "Music is the art which is most nigh to tears and memory.", author: "Oscar Wilde" },
  { text: "Music is the mediator between the spiritual and the sensual life.", author: "Ludwig van Beethoven" },
  { text: "Music is the key to the female heart.", author: "Johann Wolfgang von Goethe" },
  { text: "Music is enough for a lifetime, but a lifetime is not enough for music.", author: "Sergei Rachmaninoff" },
  { text: "Music is the electrical soil in which the spirit lives, thinks and invents.", author: "Ludwig van Beethoven" },
  { text: "Music is the best means we have of digesting time.", author: "W. H. Auden" },
  { text: "Music is the soundtrack of your life.", author: "Dick Clark" },
  { text: "Music is the refuge of souls wounded by fortune.", author: "Plutarch" },
  { text: "Music is the art of thinking with sounds.", author: "Jules Combarieu" },
  { text: "Music is the easiest method for inarticulate people to express themselves.", author: "Ned Rorem" },
  { text: "Music is the medicine of the mind.", author: "John A. Logan" },
  { text: "Music is the poetry of the air.", author: "Jean Paul Richter" },
  { text: "Music is the great uniter. An incredible force.", author: "Sarah Dessen" },
  { text: "Music is the one incorporeal entrance into the higher world of knowledge.", author: "Ludwig van Beethoven" },
  { text: "Music is the art of the prophets and the most powerful magic there is.", author: "Martin Luther" },
  { text: "Music is the pleasure the human mind experiences from counting without being aware that it is counting.", author: "Gottfried Wilhelm Leibniz" },
  { text: "Music is the only cheap and unpunished rapture upon earth.", author: "Sydney Smith" },
  { text: "Music is the pen of the soul.", author: "Saadi" },
  { text: "Music is the heart of life. She speaks love; without her, there is no possible good.", author: "Franz Liszt" },
  { text: "Music is the effort we make to explain to ourselves how our brains work.", author: "Lewis Thomas" },
  { text: "Music is the answer to the mystery of life.", author: "Arthur Schopenhauer" },
  { text: "Music is the language of the spirit. It opens the secret of life, bringing peace, abolishing strife.", author: "Kahlil Gibran" },
  { text: "Music is the best consolation for a despaired man.", author: "Martin Luther" },
  { text: "Music is my mistress, and she plays second fiddle to no one.", author: "Duke Ellington" },
  { text: "What we play is life.", author: "Louis Armstrong" },
  { text: "Music is always a commentary on society.", author: "Frank Zappa" },
  { text: "Music can name the unnameable and communicate the unknowable.", author: "Leonard Bernstein" },
  { text: "To listen is an effort, and just to hear is no merit. A duck hears also.", author: "Igor Stravinsky" },
  { text: "Music is the arithmetic of sounds as optics is the geometry of light.", author: "Claude Debussy" },
  { text: "Music is the wine that fills the cup of silence.", author: "Robert Fripp" },
  { text: "Music is the cup which holds the wine of silence.", author: "Robert Fripp" },
  { text: "I see my life in terms of music.", author: "Albert Einstein" },
  { text: "If I were not a physicist, I would probably be a musician.", author: "Albert Einstein" },
  { text: "How is it possible that a being with such sensitive jewels as the eyes… could be an irreclaimable pessimist?", author: "Pyotr Ilyich Tchaikovsky" },
  { text: "The aim and final end of all music should be none other than the glory of God and the refreshment of the soul.", author: "Johann Sebastian Bach" },
  { text: "I was obliged to be industrious. Whoever is equally industrious will succeed equally well.", author: "Johann Sebastian Bach" },
  { text: "To send light into the darkness of men’s hearts—such is the duty of the artist.", author: "Robert Schumann" },
  { text: "Simplicity is the highest goal, achievable when you have overcome all difficulties.", author: "Frédéric Chopin" },
  { text: "I am hitting my head against the walls, but the walls are giving way.", author: "Gustav Mahler" },
  { text: "Never miss a chance to do good—that is my religion.", author: "John Philip Sousa" },
  { text: "Music is the strongest form of magic.", author: "Marilyn Manson" },
  { text: "People haven’t always been there for me but music always has.", author: "Taylor Swift" },
  { text: "One good thing about music, when it hits you, you feel no pain.", author: "Bob Marley" },
  { text: "Music is a world within itself, with a language we all understand.", author: "Stevie Wonder" },
  { text: "If you have to ask what jazz is, you’ll never know.", author: "Louis Armstrong" },
  { text: "There are two means of refuge from the miseries of life: music and cats.", author: "Albert Schweitzer" },
  { text: "Music is the divine way to tell beautiful things to the heart.", author: "Pablo Casals" },
  { text: "Music is the mediator between the life of the senses and the life of the spirit.", author: "Thomas Mann" },
  { text: "All music is folk music. I ain’t never heard a horse sing a song.", author: "Louis Armstrong" },
  { text: "Sometimes you have to play a long time to be able to play like yourself.", author: "Miles Davis" },
  { text: "Do not fear mistakes — there are none.", author: "Miles Davis" },
  { text: "The only thing better than singing is more singing.", author: "Ella Fitzgerald" },
  { text: "If you don’t live it, it won’t come out of your horn.", author: "Charlie Parker" },
  { text: "Jazz washes away the dust of everyday life.", author: "Art Blakey" },
  { text: "Music is everybody’s possession. It’s only publishers who think people own it.", author: "John Lennon" },
  { text: "Music itself is going to become like running water or electricity.", author: "David Bowie" },
  { text: "Music is the emotional life of most people.", author: "Leonard Cohen" },
  { text: "I make music for ears, not eyes.", author: "Adele" },
  { text: "Writing about music is like dancing about architecture.", author: "Martin Mull" },
  { text: "Music is the shorthand of feeling.", author: "Leo Tolstoy" },
  { text: "Where words leave off, music begins.", author: "Heinrich Heine" },
  { text: "Music is the voice of the angels.", author: "Lizzie DeArmond" },
  { text: "Music is love in search of a word.", author: "Sidney Lanier" },
  { text: "Music is the art which can lift us closest to heaven.", author: "Ralph Waldo Emerson" },
  { text: "Music is the poor man’s Parnassus.", author: "Ralph Waldo Emerson" },
  { text: "Music is the universal language of beauty.", author: "Henry Wadsworth Longfellow" },
  { text: "Music is healing.", author: "Prince" },
  { text: "Music is not what you do, it’s what gets done to you.", author: "Brian Eno" },
  { text: "Participation — that’s what’s gonna save the human race.", author: "Pete Seeger" },
  { text: "Jazz is not just music, it is a way of life, a way of being, a way of thinking.", author: "Nina Simone" },
  { text: "The sign of a mature musician is knowing what not to play.", author: "Dizzy Gillespie" },
  { text: "Music doesn’t lie. If there is something to be changed in this world, it can only happen through music.", author: "Jimi Hendrix" },
  { text: "I was born with music inside me. Music was one of my parts.", author: "Ray Charles" },
  { text: "A song is anything that can walk by itself.", author: "Bob Dylan" },
  { text: "Music does a lot of things for a lot of people. It’s transported me many places.", author: "Aretha Franklin" },
  { text: "Music enhances the education of the mind and of the heart.", author: "Yo-Yo Ma" },
  { text: "One must always pull something out of each piece of music that speaks to you personally.", author: "Itzhak Perlman" },
  { text: "Sound has the power to carry one through time and space.", author: "Daniel Barenboim" },
  { text: "Music is the only thing that makes sense anymore.", author: "Quincy Jones" },
  { text: "Music happens not on the page; it happens in the air.", author: "Herbie Hancock" },
  { text: "Music is the tool to keep tapping into something bigger than yourself.", author: "Esperanza Spalding" },
];

/** One quote per full page load; stable across React StrictMode double-mount in dev. */
export function getTopBarQuote(): MusicQuote {
  if (stableTopBarQuoteIndex === null) {
    stableTopBarQuoteIndex = Math.floor(Math.random() * MUSIC_QUOTES.length);
  }
  return MUSIC_QUOTES[stableTopBarQuoteIndex]!;
}

export function formatMusicQuote(q: MusicQuote): string {
  return `“${q.text}”\n${q.author}`;
}

/** Random quote (new each call) — for generator shuffle. */
export function pickRandomMusicQuote(): MusicQuote {
  return MUSIC_QUOTES[Math.floor(Math.random() * MUSIC_QUOTES.length)]!;
}

// Daily inspiring quotes
const inspiringQuotes = [
    { text: "The journey of a thousand miles begins with one step.", author: "Lao Tzu" },
    { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
    { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
    { text: "In the end, we will remember not the words of our enemies, but the silence of our friends.", author: "Martin Luther King Jr." },
    { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
    { text: "Your limitation—it's only your imagination.", author: "Unknown" },
    { text: "Yesterday you said tomorrow. Just do it.", author: "Nike" },
    { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
    { text: "Don't let yesterday take up too much of today.", author: "Will Rogers" },
    { text: "You learn more from failure than from success. Don't let it stop you. Failure builds character.", author: "Unknown" },
    { text: "If you are working on something that you really care about, you don't have to be pushed. The vision pulls you.", author: "Steve Jobs" },
    { text: "People who are crazy enough to think they can change the world, are the ones who do.", author: "Rob Siltanen" },
    { text: "Don't be afraid to give yourself everything you've ever wanted in life.", author: "Unknown" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "When you have a dream, you've got to grab it and never let go.", author: "Carol Burnett" },
    { text: "Nothing is impossible. The word itself says 'I'm possible!'", author: "Audrey Hepburn" },
    { text: "There is nothing impossible to they who will try.", author: "Alexander the Great" },
    { text: "The bad news is time flies. The good news is you're the pilot.", author: "Michael Altshuler" },
    { text: "Keep your face always toward the sunshine—and shadows will fall behind you.", author: "Walt Whitman" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
    { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
    { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
    { text: "Try to be a rainbow in someone's cloud.", author: "Maya Angelou" },
    { text: "Do not go where the path may lead, go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson" },
    { text: "Be kind whenever possible. It is always possible.", author: "Dalai Lama" },
    { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
    { text: "What we think, we become.", author: "Buddha" }
];

// Display daily quote based on date
function displayDailyQuote() {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const quoteIndex = dayOfYear % inspiringQuotes.length;
    const todaysQuote = inspiringQuotes[quoteIndex];

    document.getElementById('quote-text').textContent = `"${todaysQuote.text}"`;
    document.getElementById('quote-author').textContent = `— ${todaysQuote.author}`;
}

// Load quote when page loads
window.addEventListener('DOMContentLoaded', displayDailyQuote);

function preferenceChoice(event) {
    if (event === 1) {
        window.location.href = '/pages/roteform.html';
    } else if (event === 2) {
        window.location.href = '/pages/flowform.html';
    } else if (event === 3) {
        window.location.href = '/pages/freeform.html';
    }
}

function goToEntries() {
    window.location.href = '/pages/journal-entries.html';
}

function goToAbout() {
    window.location.href = '/pages/about.html';
}
module.exports = {
    content: ['./src/**/*.{html,js,jsx,ts,tsx}'],
    plugins: [],
    theme: {
        extend: {
            colors: {
                'opaque': {
                    50:'rgba(0,0,0,0.05)',
                    100:'rgba(0,0,0,0.1)',
                    200:'rgba(0,0,0,0.2)',
                    300:'rgba(0,0,0,0.3)',
                    400:'rgba(0,0,0,0.4)',
                    500:'rgba(0,0,0,0.5)',
                    600:'rgba(0,0,0,0.6)',
                    700:'rgba(0,0,0,0.7)',
                    800:'rgba(0,0,0,0.8)',
                    900:'rgba(0,0,0,0.9)',
                },
            },
            backgroundSize: {
                'pyth-hyp': '70.66% 70.66%',
                'pyth-adj': '141.51% 141.51%',
            },
            rotate: {
                '135': '135deg',
            },
        }
    }
}

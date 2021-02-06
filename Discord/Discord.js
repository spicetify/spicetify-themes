const element = document.querySelector('.view-player .player-controls-container .controls .button-play.button-play');
const badge = document.querySelector('.profile .incognito-badge');

let prevState = element.classList.contains('playing');

if (!prevState) badge.classList.add('paused');

const observer = new MutationObserver((mutations) => { 
    mutations.forEach((mutation) => {
        const { target } = mutation;
        if (mutation.attributeName === 'class') {
            const currentState = mutation.target.classList.contains('playing');
            if (prevState !== currentState) {
                prevState = currentState;
				if (currentState) badge.classList.remove('paused');
				else badge.classList.add('paused');
            }
        }
    });
});

observer.observe(element, { 
  attributes: true, 
  attributeOldValue: true, 
  attributeFilter: ['class'] 
});
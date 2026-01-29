// Countdown to February 16, 2026
const targetDate = new Date('2026-02-16T00:00:00').getTime();

// Update countdown every second
const countdownInterval = setInterval(updateCountdown, 1000);

// Initial update
updateCountdown();

function updateCountdown() {
    const now = new Date().getTime();
    const distance = targetDate - now;
    
    // If countdown is finished
    if (distance < 0) {
        clearInterval(countdownInterval);
        document.getElementById('days').textContent = '00';
        document.getElementById('hours').textContent = '00';
        document.getElementById('minutes').textContent = '00';
        document.getElementById('seconds').textContent = '00';
        return;
    }
    
    // Calculate time units
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    // Update DOM with animation
    updateValue('days', days);
    updateValue('hours', hours);
    updateValue('minutes', minutes);
    updateValue('seconds', seconds);
}

function updateValue(elementId, value) {
    const element = document.getElementById(elementId);
    const formattedValue = value.toString().padStart(2, '0');
    
    if (element.textContent !== formattedValue) {
        // Add pulse animation on change
        element.style.transform = 'scale(1.1)';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 200);
        
        element.textContent = formattedValue;
    }
}

// Add smooth transition to countdown values
document.querySelectorAll('.countdown-value').forEach(element => {
    element.style.transition = 'transform 0.2s ease';
});

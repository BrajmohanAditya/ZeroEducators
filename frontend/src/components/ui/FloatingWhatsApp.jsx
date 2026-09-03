import React from 'react';

const FloatingWhatsApp = () => {
  // Replace this with your actual phone number (include country code, without + or spaces)
  const phoneNumber = "6287029439"; 
  const message = "Hello! I have a question about your courses."; // Default message

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 hover:scale-110 transition-all duration-300 ease-in-out cursor-pointer group"
      aria-label="Chat with us on WhatsApp"
    >
      {/* RADIATING PING EFFECT */}
      <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50 animate-pulse"></span>
      
      {/* WhatsApp SVG Logo */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="32"
        height="32"
        fill="currentColor"
        className="relative z-10 transform group-hover:rotate-12 transition-transform duration-300"
      >
        <path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.148.562 4.195 1.633 6.002L.15 23.513l5.632-1.479c1.73.993 3.693 1.517 5.733 1.517v-.001h.005c6.642 0 12.028-5.385 12.028-12.028S18.673 0 12.031 0zm0 21.554h-.004c-1.802 0-3.568-.484-5.116-1.402l-.367-.217-3.8.998.998-3.705-.238-.378A9.99 9.99 0 0 1 2.008 12.03C2.008 6.497 6.498 2.008 12.031 2.008s10.022 4.489 10.022 10.022-4.489 10.024-10.022 10.024zm5.492-7.513c-.301-.151-1.782-.879-2.058-.98-.276-.1-.477-.151-.678.151-.201.301-.778.98-1.028 1.181-.251.201-.502.251-.803.1-.301-.151-1.272-.469-2.423-1.494-.895-.798-1.501-1.783-1.677-2.084-.176-.301-.019-.464.132-.614.135-.135.301-.351.452-.527.151-.176.201-.301.301-.502.1-.201.05-.377-.025-.527-.075-.151-.678-1.633-.928-2.235-.243-.588-.492-.507-.678-.517-.176-.008-.377-.01-.578-.01-.201 0-.527.075-.803.377-.276.301-1.054 1.03-1.054 2.511s1.079 2.912 1.229 3.113c.151.201 2.124 3.242 5.143 4.545.719.31 1.28.495 1.718.634.722.23 1.378.197 1.895.12.578-.087 1.782-.728 2.033-1.431.251-.703.251-1.306.176-1.432-.075-.126-.276-.201-.578-.352z"/>
      </svg>
    </a>
  );

};

export default FloatingWhatsApp;

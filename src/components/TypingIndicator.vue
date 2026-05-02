<template>
  <div class="ac-typing" aria-label="Assistant is typing">
    <span class="ac-typing__dot" />
    <span class="ac-typing__dot" />
    <span class="ac-typing__dot" />
  </div>
</template>

<style scoped>
.ac-typing {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 14px;
  background: var(--ac-agent-bubble-bg, #f3f4f6);
  border-radius: 18px 18px 18px 4px;
  width: fit-content;
  margin: 4px 0;
}

.ac-typing__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #9ca3af;
  animation: ac-bounce 1.2s ease-in-out infinite;
}

.ac-typing__dot:nth-child(2) { animation-delay: 0.2s; }
.ac-typing__dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes ac-bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}
</style>

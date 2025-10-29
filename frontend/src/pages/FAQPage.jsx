const FAQPage = () => {
  const faqs = [
    { q: 'What is UMEvents?', a: 'A platform to discover, create, and manage campus events.' },
    { q: 'Who can create events?', a: 'Verified club accounts (approved by admin) can create events.' },
    { q: 'How do I buy tickets?', a: 'Sign in as a student, open an event, and click Buy Ticket.' },
    { q: 'Which payments are supported?', a: 'ToyyibPay FPX/e-wallet or organizer manual QR, depending on the event.' },
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-4xl font-bold mb-8 font-heading">Frequently Asked Questions</h1>
      <div className="space-y-4">
        {faqs.map((item, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">{item.q}</h3>
            <p className="text-gray-600">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQPage;



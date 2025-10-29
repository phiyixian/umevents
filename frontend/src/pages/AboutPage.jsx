const AboutPage = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 font-heading">About UMEvents</h1>

      <section className="py-6">
        <h2 className="text-3xl font-bold text-center mb-12 font-heading">Why Choose UMEvents?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card text-center">
            <div className="w-16 h-16 bg-umyellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-umblue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 font-heading">Easy Event Creation</h3>
            <p className="text-gray-600">Create and manage your events with just a few clicks</p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 bg-umyellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-umblue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 font-heading">Secure Payments</h3>
            <p className="text-gray-600">Pay seamlessly with DuitNow FPX / QR integration</p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 bg-umyellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-umblue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 font-heading">Real-time Analytics</h3>
            <p className="text-gray-600">Track your event performance with detailed insights</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;



export function FeatureComparison() {
  const features = [
    { name: "Unlimited flashcards", free: true, premium: true, pro: true },
    { name: "AI credits per month", free: "500", premium: "2,000", pro: "Unlimited" },
    { name: "Smart study scheduling", free: true, premium: true, pro: true },
    { name: "AI tutor assistance", free: "Basic", premium: "Advanced", pro: "Priority" },
    { name: "PDF & image import", free: true, premium: true, pro: true },
    { name: "Team collaboration", free: false, premium: false, pro: true },
    { name: "Advanced analytics", free: false, premium: true, pro: true },
    { name: "Priority support", free: false, premium: false, pro: true },
    { name: "Custom branding", free: false, premium: false, pro: true },
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Feature Comparison</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--card-border)]">
                <th className="py-4 px-6 text-left">Feature</th>
                <th className="py-4 px-6 text-center">Free</th>
                <th className="py-4 px-6 text-center">Premium <span className="block text-xs text-[var(--accent)]">(Coming Soon)</span></th>
                <th className="py-4 px-6 text-center">Pro <span className="block text-xs text-[var(--accent)]">(Coming Soon)</span></th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr key={index} className="border-b border-[var(--card-border)]">
                  <td className="py-4 px-6">{feature.name}</td>
                  <td className="py-4 px-6 text-center">
                    {typeof feature.free === 'boolean' ? (
                      feature.free ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-green-500">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-[var(--muted)]">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      )
                    ) : (
                      <span>{feature.free}</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {typeof feature.premium === 'boolean' ? (
                      feature.premium ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-green-500">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-[var(--muted)]">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      )
                    ) : (
                      <span>{feature.premium}</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {typeof feature.pro === 'boolean' ? (
                      feature.pro ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-green-500">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-[var(--muted)]">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      )
                    ) : (
                      <span>{feature.pro}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
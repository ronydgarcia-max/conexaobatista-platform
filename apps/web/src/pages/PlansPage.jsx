import React from 'react';
import PlansList from '@/components/PlansList.jsx';

/**
 * Shipped pricing page.
 *
 * Renders the subscription tiers via the shipped <PlansList />. Plans are
 * fetched at runtime through useEcommerceSubscriptionsPlans (shipped read-only
 * hook); per-card SubscribeButton / ManageSubscriptionButton swap is handled
 * inside PlansList.
 *
 * Mount on App.jsx as a PUBLIC route at /plans (no auth gate — anonymous
 * visitors browse pricing; SubscribeButton redirects to /login when needed):
 *   import PlansPage from '@/pages/PlansPage.jsx';
 *   <Route path="/plans" element={<PlansPage />} />
 *
 * Header/nav MUST include a "Plans" or "Pricing" link to /plans.
 *
 * Agents may restyle copy/hero/surrounding sections freely (FAQ, comparison
 * tables, value props, testimonials — whatever fits the site). PRESERVE the
 * <PlansList /> mount inside the page. Do NOT recreate plan-fetching,
 * subscribe-button logic, or hardcode a plans array — those live in
 * PlansList and its dependencies and would create a parallel (broken) flow.
 */
export default function PlansPage() {
	return (
		<div className="mx-auto max-w-6xl px-6 py-12">
			<header className="mb-10 text-center">
				<h1 className="text-3xl font-semibold sm:text-4xl">Choose your plan</h1>
				<p className="mt-3 text-muted-foreground">
					Pick the tier that fits how you'll use it. Upgrade or cancel anytime.
				</p>
			</header>
			<PlansList />
		</div>
	);
}

import Link from "next/link";

export default function CheckoutFail() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-rose-100 text-5xl">
        😕
      </div>
      <h1 className="mt-6 text-3xl font-bold text-ink-900">Payment failed</h1>
      <p className="mt-2 text-ink-500">
        Your payment could not be processed. No charge was made.
      </p>
      <div className="card mt-6 space-y-2 p-5 text-left text-sm text-ink-700">
        <div className="font-semibold text-ink-900">Common reasons:</div>
        <ul className="list-disc space-y-1 pl-5">
          <li>Insufficient funds or card limit reached</li>
          <li>Card issuer declined the transaction</li>
          <li>Incorrect card details</li>
          <li>Browser blocked the payment popup</li>
        </ul>
      </div>
      <div className="mt-6 flex flex-col items-center gap-3">
        <Link href="/pricing" className="btn-primary w-full max-w-xs">
          Try again
        </Link>
        <Link href="/contact" className="btn-outline w-full max-w-xs">
          Contact support
        </Link>
      </div>
    </div>
  );
}

export default function DashboardLoading() {
    return (
        <div className="w-full animate-pulse">
            <div className="container mx-auto py-2">
                {/* Header Skeleton */}
                <header className="mb-8">
                    <div className="h-10 w-64 bg-slate-800 rounded-lg mb-2"></div>
                    <div className="h-4 w-48 bg-slate-800 rounded-lg"></div>
                </header>

                {/* Status Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-32 bg-slate-800/50 rounded-3xl border border-slate-700/50"></div>
                    ))}
                </div>

                {/* Gantt Chart Skeleton */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-6 h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                        <div className="h-6 w-48 bg-slate-800 rounded-lg"></div>
                        <div className="h-8 w-24 bg-slate-800 rounded-lg"></div>
                    </div>
                    <div className="w-full h-full bg-slate-800/30 rounded-xl"></div>
                </div>
            </div>
        </div>
    );
}

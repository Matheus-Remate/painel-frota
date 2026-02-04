export default function VehiclesLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-800 rounded-full"></div>
                    <div>
                        <div className="h-8 w-32 bg-slate-800 rounded-lg mb-2"></div>
                        <div className="h-4 w-48 bg-slate-800 rounded-lg"></div>
                    </div>
                </div>
                <div className="h-10 w-32 bg-slate-800 rounded-lg"></div>
            </div>

            <div className="h-14 w-full bg-slate-800/50 rounded-xl border border-slate-700/50"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="h-64 bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 bg-slate-800 rounded-lg"></div>
                            <div className="h-6 w-20 bg-slate-800 rounded-full"></div>
                        </div>
                        <div className="h-6 w-3/4 bg-slate-800 rounded-lg mb-2"></div>
                        <div className="h-8 w-1/2 bg-slate-800 rounded-lg mb-4"></div>
                        <div className="space-y-2">
                            <div className="h-4 w-full bg-slate-800 rounded-lg"></div>
                            <div className="h-4 w-full bg-slate-800 rounded-lg"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

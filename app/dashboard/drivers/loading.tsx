export default function DriversLoading() {
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

            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="p-4 border-b border-slate-700/50 flex gap-4">
                    <div className="h-10 flex-1 bg-slate-800 rounded-lg"></div>
                    <div className="h-10 w-24 bg-slate-800 rounded-lg"></div>
                </div>
                <div className="divide-y divide-slate-700/50">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-800 rounded-full"></div>
                                <div>
                                    <div className="h-5 w-48 bg-slate-800 rounded-lg mb-2"></div>
                                    <div className="h-4 w-32 bg-slate-800 rounded-lg"></div>
                                </div>
                            </div>
                            <div className="h-8 w-20 bg-slate-800 rounded-lg"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

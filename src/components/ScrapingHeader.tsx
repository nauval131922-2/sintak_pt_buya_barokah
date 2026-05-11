import { ReactNode } from 'react';
import { Clock } from 'lucide-react';
import { formatScrapedPeriodDate } from '@/lib/scraper-period';

interface ScrapingHeaderProps {
  title: string;
  icon?: ReactNode;
  lastUpdated?: string | null;
  scrapedPeriod?: { start: string; end: string } | null;
  lastExcelUpdate?: string | null;
  lastScrapedUpdate?: string | null;
}

export default function ScrapingHeader({
  title,
  icon = <Clock size={16} />,
  lastUpdated,
  scrapedPeriod,
  lastExcelUpdate,
  lastScrapedUpdate
}: ScrapingHeaderProps) {
  return (
    <div className="flex items-center gap-5">
      <h3 className="text-[14px] font-bold text-gray-800 flex items-center gap-3 leading-none">
        <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shadow-sm shrink-0">
          {icon}
        </div>
        <span>{title}</span>
      </h3>
      {/* Dual Update Mode (khusus halaman Data SOPD) */}
      {(lastExcelUpdate || lastScrapedUpdate) ? (
        <div className="flex items-center gap-3 text-[11px] font-bold text-gray-400 leading-none">
          {lastExcelUpdate && (
            <>
              <span className="w-1 h-1 rounded-full bg-emerald-200 shrink-0"></span>
              <span className="text-emerald-600">
                Excel: {lastExcelUpdate}
              </span>
            </>
          )}
          {lastExcelUpdate && lastScrapedUpdate && <span className="text-gray-300">|</span>}
          {lastScrapedUpdate && (
            <>
              <span className="w-1 h-1 rounded-full bg-blue-200 shrink-0"></span>
              <span className="text-blue-500">
                Tarik Data: {lastScrapedUpdate}
                {scrapedPeriod ? ` (${formatScrapedPeriodDate(scrapedPeriod.start)} - ${formatScrapedPeriodDate(scrapedPeriod.end)})` : ''}
              </span>
            </>
          )}
        </div>
      ) : (
        /* Legacy / Single Update Mode */
        lastUpdated && (
          <div className="flex items-center gap-3 text-[11px] font-bold text-gray-400 leading-none">
            <span className="w-1 h-1 rounded-full bg-gray-200 shrink-0"></span>
            <span>
              Update: {lastUpdated}
              {scrapedPeriod ? ` (${formatScrapedPeriodDate(scrapedPeriod.start)} - ${formatScrapedPeriodDate(scrapedPeriod.end)})` : ''}
            </span>
          </div>
        )
      )}
    </div>
  );
}

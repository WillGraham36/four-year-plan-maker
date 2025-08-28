import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import AreaRequirements from '@/components/audit/area-requirements';
import LowerLevelRequirements from '@/components/audit/lower-level-reqs';
import TrackRequirements from '@/components/audit/track-requirements';
import UpperLevelConcentrationContainer from '@/components/ul-concentration/ul-concentration';
import { CsSpecializations } from "@/lib/utils/types";

interface ResponsiveAuditLayoutProps {
  concentration: string;
  initialTrack?: CsSpecializations;
}

const ResponsiveAuditLayout = ({ concentration, initialTrack }: ResponsiveAuditLayoutProps) => {
  return (
    <>
      {/* Mobile/Tablet Layout - Tabs (visible below md) */}
      <div className="md:hidden">
        <Tabs defaultValue="lower-level" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="lower-level" className="text-xs w-full">Lower Level</TabsTrigger>
            <TabsTrigger value="area" className="text-xs w-full">Area Reqs</TabsTrigger>
            <TabsTrigger value="upper-level" className="text-xs w-full">Upper Level</TabsTrigger>
            <TabsTrigger value="track" className="text-xs w-full">Track Reqs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="lower-level" className="min-h-[400px]">
            <div className="space-y-4">
              <LowerLevelRequirements />
            </div>
          </TabsContent>

          <TabsContent value="area" className="min-h-[400px]">
            <div className="space-y-4">
              <AreaRequirements />
            </div>
          </TabsContent>
          
          <TabsContent value="upper-level" className="min-h-[400px]">
            <div className="space-y-4">
              <UpperLevelConcentrationContainer concentration={concentration} />
            </div>
          </TabsContent>
          
          <TabsContent value="track" className="min-h-[400px]">
            <div className="space-y-4">
              <TrackRequirements initialTrack={initialTrack} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop Layout - Side by side (visible md and above) */}
      <div className="hidden md:flex md:flex-row md:gap-4">
        <section className="flex flex-col gap-4 flex-1">
          <LowerLevelRequirements />
          <AreaRequirements />
        </section>
        <section className="flex flex-col gap-4 flex-1">
          <TrackRequirements initialTrack={initialTrack} />
          <UpperLevelConcentrationContainer concentration={concentration} />
        </section>
      </div>
    </>
  );
};

export default ResponsiveAuditLayout;
import React from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crown, Lock } from "lucide-react";
import { PlanKey, QualitySettingsProps } from './ArtGeneration';

export const QualitySettings: React.FC<QualitySettingsProps> = ({
  plan,
  dpi,
  resolution,
  quality,
  currentConfig,
  allDpiOptions,
  allResolutionOptions,
  allQualityOptions,
  onDpiChange,
  onResolutionChange,
  onQualityChange,
  onUpgradeClick
}) => {
  return (
    <div className="bg-muted/20 p-4 rounded-lg mb-4">
      {/* Plan info banner */}
      {plan === 'free' && (
        <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <Crown className="w-4 h-4" />
            <span>You're on the <strong>Free</strong> plan. Upgrade to unlock higher quality options!</span>
            <Button
              size="sm"
              variant="outline"
              onClick={onUpgradeClick}
              className="ml-auto"
            >
              Upgrade
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* DPI Setting */}
        <div className="space-y-2">
          <Label htmlFor="dpi-select">DPI Resolution</Label>
          <Select
            value={dpi.toString()}
            onValueChange={(value) => {
              const newDpi = Number(value);
              // Only allow change if option is allowed for current plan
              if (currentConfig.dpiOptions.includes(newDpi)) {
                onDpiChange(newDpi);
              } else {
                // Navigate to subscription page if trying to select restricted option
                onUpgradeClick();
              }
            }}
          >
            <SelectTrigger id="dpi-select">
              <SelectValue placeholder="Select DPI" />
            </SelectTrigger>
            <SelectContent>
              {allDpiOptions.map((opt) => {
                const isAllowed = currentConfig.dpiOptions.includes(opt);
                const isRestricted = !isAllowed;
                return (
                  <SelectItem
                    key={opt}
                    value={opt.toString()}
                    disabled={isRestricted}
                    className={isRestricted ? 'opacity-50' : ''}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{opt} DPI</span>
                      {isRestricted && (
                        <Lock className="w-3 h-3 ml-2 text-muted-foreground" />
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {dpi >= 300 ? '✓ Print-ready quality' : 'Web display only'}
            {!currentConfig.dpiOptions.includes(dpi) && plan === 'free' && (
              <span className="block mt-1 text-amber-600">
                <Lock className="w-3 h-3 inline mr-1" />
                Upgrade required for {dpi} DPI
              </span>
            )}
          </p>
        </div>

        {/* Resolution Setting */}
        <div className="space-y-2">
          <Label htmlFor="resolution-select">Image Resolution</Label>
          <Select
            value={resolution}
            onValueChange={(value) => {
              // Only allow change if option is allowed for current plan
              if (currentConfig.resolutionOptions.find(r => r.value === value)) {
                onResolutionChange(value);
              } else {
                // Navigate to subscription page if trying to select restricted option
                onUpgradeClick();
              }
            }}
          >
            <SelectTrigger id="resolution-select">
              <SelectValue placeholder="Select Resolution" />
            </SelectTrigger>
            <SelectContent>
              {allResolutionOptions.map((opt) => {
                const isAllowed = currentConfig.resolutionOptions.find(r => r.value === opt.value) !== undefined;
                const isRestricted = !isAllowed;
                const requiredPlan = opt.plan === 'basic' ? 'Basic' : opt.plan === 'premium' ? 'Premium' : '';
                return (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    disabled={isRestricted}
                    className={isRestricted ? 'opacity-50' : ''}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{opt.label}</span>
                      {isRestricted && (
                        <div className="flex items-center gap-1 ml-2">
                          <Lock className="w-3 h-3 text-muted-foreground" />
                          {requiredPlan && (
                            <span className="text-xs text-muted-foreground">{requiredPlan}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {currentConfig.resolutionOptions.find(r => r.value === resolution)?.label || 'Good for most uses'}
            {!currentConfig.resolutionOptions.find(r => r.value === resolution) && plan === 'free' && (
              <span className="block mt-1 text-amber-600">
                <Lock className="w-3 h-3 inline mr-1" />
                Upgrade required for {resolution}px
              </span>
            )}
          </p>
        </div>

        {/* Quality Setting */}
        <div className="space-y-2">
          <Label htmlFor="quality-select">Generation Quality</Label>
          <Select
            value={quality}
            onValueChange={(value) => {
              // Only allow change if option is allowed for current plan
              if (currentConfig.qualityOptions.includes(value)) {
                onQualityChange(value);
              } else {
                // Navigate to subscription page if trying to select restricted option
                onUpgradeClick();
              }
            }}
          >
            <SelectTrigger id="quality-select">
              <SelectValue placeholder="Select Quality" />
            </SelectTrigger>
            <SelectContent>
              {allQualityOptions.map((opt) => {
                const isAllowed = currentConfig.qualityOptions.includes(opt.value);
                const isRestricted = !isAllowed;
                const requiredPlan = opt.plan === 'basic' ? 'Basic' : opt.plan === 'premium' ? 'Premium' : '';
                return (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    disabled={isRestricted}
                    className={isRestricted ? 'opacity-50' : ''}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{opt.label}</span>
                      {isRestricted && (
                        <div className="flex items-center gap-1 ml-2">
                          <Lock className="w-3 h-3 text-muted-foreground" />
                          {requiredPlan && (
                            <span className="text-xs text-muted-foreground">{requiredPlan}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {quality === 'ultra' ? 'Highest quality, best for printing' :
             quality === 'high' ? 'High quality, good balance' :
             'Standard quality, faster generation'}
            {!currentConfig.qualityOptions.includes(quality) && plan === 'free' && (
              <span className="block mt-1 text-amber-600">
                <Lock className="w-3 h-3 inline mr-1" />
                Upgrade required for {quality} quality
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

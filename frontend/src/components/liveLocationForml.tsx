import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LiveLocationForm ({
  formData,
  handleInputChange,
  handleSubmit,
  formRef,
}) {
  return (<form onSubmit={handleSubmit} ref={formRef} className="space-y-4">
    <div>
      <Label htmlFor="name">Name</Label>
      <Input
        id="name"
        name="name"
        value={formData.name}
        onChange={handleInputChange}
        onPointerDown={(e) => e.stopPropagation()}
        required
        className="mt-1"
      />
      <p className="text-sm text-muted-foreground mt-1">
        This will be displayed to others when they view your location.
      </p>
    </div>
    <div>
      <Label htmlFor="description">Description</Label>
      <Input
        id="description"
        name="description"
        value={formData.description}
        onChange={handleInputChange}
        onPointerDown={(e) => e.stopPropagation()}
        required
        className="mt-1"
      />
      <p className="text-sm text-muted-foreground mt-1">
        Please specify your purpose for sharing location. Are you a driver,
        passenger, or working on a photo objective?
      </p>
    </div>
    <Button type="submit" className="w-full">
      Start Sharing!
    </Button>
  </form>)
};
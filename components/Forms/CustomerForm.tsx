import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { addCustomer, updateCustomer } from "@/api/customer";
import { CustomerDetail } from "@/types/type";

interface CustomerFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: CustomerDetail | null;
}

interface CustomerFormData {
  businessName: string;
  gstin: string;
  contactPerson: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  pincode: string;
  creditLimit: number;
  openingBalance: number;
}

export default function CustomerForm({
  onSuccess,
  onCancel,
  initialData,
}: CustomerFormProps) {
  const isEditMode = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    defaultValues: initialData
      ? {
          businessName: initialData.businessName,
          gstin: initialData.gstin || "",
          contactPerson: initialData.contactPerson || "",
          phone: initialData.phone || "",
          email: initialData.email || "",
          addressLine1: initialData.addressLine1 || "",
          addressLine2: initialData.addressLine2 || "",
          city: initialData.city || "",
          pincode: initialData.pincode || "",
          creditLimit: initialData.creditLimit || 0,
          openingBalance: initialData.openingBalance || 0,
        }
      : undefined,
  });

  const onSubmit = async (data: CustomerFormData) => {
    try {
      if (isEditMode) {
        const res = await updateCustomer(initialData._id, data);
        if (res?.data.statusCode === 200) {
          toast.success("Customer updated successfully");
          onSuccess?.();
        }
      } else {
        // For create, map openingBalance to currentBalance for backward compat
        const createData = {
          ...data,
          currentBalance: data.openingBalance || 0,
        };
        const res = await addCustomer(createData);
        if (res?.data.statusCode === 200 || res?.data.statusCode === 201) {
          toast.success("Customer created successfully");
          reset();
          onSuccess?.();
        }
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        (error instanceof Error ? error.message : `Failed to ${isEditMode ? "update" : "create"} customer`);
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto">
        {/* Basic Information */}
        <div className="grid gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Business Name*
            </label>
            <Input
              {...register("businessName", {
                required: "Business name is required",
              })}
              placeholder="Enter business name"
              className={errors.businessName ? "border-red-500" : ""}
            />
            {errors.businessName && (
              <p className="text-red-500 text-xs mt-1">
                {errors.businessName.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">GSTIN</label>
              <Input
                {...register("gstin")}
                placeholder="Enter GSTIN"
              />
              {errors.gstin && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.gstin.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Contact Person
              </label>
              <Input
                {...register("contactPerson")}
                placeholder="Enter contact person name"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <Input
                {...register("email", {
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Invalid email format",
                  },
                })}
                type="email"
                placeholder="Enter email"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Phone Number
              </label>
              <Input
                {...register("phone", {
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: "Invalid phone number",
                  },
                })}
                placeholder="Enter phone number"
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>

          {/* Address Fields */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              Address Line 1
            </label>
            <Input
              {...register("addressLine1")}
              placeholder="Building number, Street name"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Address Line 2
            </label>
            <Input
              {...register("addressLine2")}
              placeholder="Landmark, Area (Optional)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">City</label>
              <Input {...register("city")} placeholder="Enter city" />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Pincode</label>
              <Input
                {...register("pincode", {
                  pattern: {
                    value: /^[0-9]{6}$/,
                    message: "Invalid pincode",
                  },
                })}
                placeholder="Enter pincode"
                maxLength={6}
                className={errors.pincode ? "border-red-500" : ""}
              />
              {errors.pincode && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.pincode.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Credit Limit
              </label>
              <Input
                {...register("creditLimit", {
                  min: {
                    value: 0,
                    message: "Credit limit must be positive",
                  },
                })}
                type="number"
                placeholder="Enter credit limit"
                className={errors.creditLimit ? "border-red-500" : ""}
              />
              {errors.creditLimit && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.creditLimit.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Opening Balance
              </label>
              <Input
                {...register("openingBalance", {
                  valueAsNumber: true,
                  min: {
                    value: 0,
                    message: "Opening balance cannot be negative",
                  },
                })}
                type="number"
                placeholder="Enter opening balance"
                className={errors.openingBalance ? "border-red-500" : ""}
              />
              {errors.openingBalance && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.openingBalance.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Make sure to verify the GSTIN number before {isEditMode ? "updating" : "adding"} the customer.
          </AlertDescription>
        </Alert>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? isEditMode
              ? "Updating..."
              : "Adding..."
            : isEditMode
            ? "Update Customer"
            : "Add Customer"}
        </Button>
      </div>
    </form>
  );
}
